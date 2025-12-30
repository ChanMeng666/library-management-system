/**
 * Stripe 自动配置脚本
 *
 * 运行方式:
 * 1. 确保已安装依赖: npm install
 * 2. 设置 STRIPE_SECRET_KEY 环境变量
 * 3. 运行: npx ts-node scripts/setup-stripe.ts
 *
 * 或者使用 tsx:
 * npx tsx scripts/setup-stripe.ts
 */

import Stripe from 'stripe'

// 从环境变量获取 Stripe Secret Key
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

if (!STRIPE_SECRET_KEY) {
    console.error('❌ 错误: 请设置 STRIPE_SECRET_KEY 环境变量')
    console.log('\n使用方法:')
    console.log('  Windows PowerShell:')
    console.log('    $env:STRIPE_SECRET_KEY="sk_test_xxx"; npx tsx scripts/setup-stripe.ts')
    console.log('\n  Windows CMD:')
    console.log('    set STRIPE_SECRET_KEY=sk_test_xxx && npx tsx scripts/setup-stripe.ts')
    console.log('\n  Linux/Mac:')
    console.log('    STRIPE_SECRET_KEY=sk_test_xxx npx tsx scripts/setup-stripe.ts')
    process.exit(1)
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2025-04-30.basil',
})

// 订阅计划配置
const PLANS = [
    {
        name: 'Basic Plan',
        description: 'Great for small libraries - Up to 1,000 books, 25 members',
        monthlyPrice: 999, // $9.99 in cents
        yearlyPrice: 9999, // $99.99 in cents
        metadata: {
            plan_id: 'basic',
            max_books: '1000',
            max_users: '25',
        },
    },
    {
        name: 'Pro Plan',
        description: 'For growing organizations - Up to 10,000 books, 100 members',
        monthlyPrice: 2999, // $29.99 in cents
        yearlyPrice: 29999, // $299.99 in cents
        metadata: {
            plan_id: 'pro',
            max_books: '10000',
            max_users: '100',
        },
    },
    {
        name: 'Enterprise Plan',
        description: 'For large institutions - Unlimited books and members',
        monthlyPrice: 9999, // $99.99 in cents
        yearlyPrice: 99999, // $999.99 in cents
        metadata: {
            plan_id: 'enterprise',
            max_books: 'unlimited',
            max_users: 'unlimited',
        },
    },
]

interface PriceResult {
    planId: string
    productId: string
    monthlyPriceId: string
    yearlyPriceId: string
}

async function createProduct(plan: typeof PLANS[0]): Promise<PriceResult> {
    console.log(`\n📦 创建产品: ${plan.name}`)

    // 检查是否已存在同名产品
    const existingProducts = await stripe.products.search({
        query: `name:"${plan.name}"`,
    })

    let product: Stripe.Product

    if (existingProducts.data.length > 0) {
        product = existingProducts.data[0]
        console.log(`   ⚠️  产品已存在，使用现有产品: ${product.id}`)
    } else {
        product = await stripe.products.create({
            name: plan.name,
            description: plan.description,
            metadata: plan.metadata,
        })
        console.log(`   ✅ 产品已创建: ${product.id}`)
    }

    // 查找或创建月付价格
    const existingMonthlyPrices = await stripe.prices.list({
        product: product.id,
        type: 'recurring',
        active: true,
    })

    let monthlyPrice = existingMonthlyPrices.data.find(
        (p) => p.recurring?.interval === 'month' && p.unit_amount === plan.monthlyPrice
    )

    if (!monthlyPrice) {
        monthlyPrice = await stripe.prices.create({
            product: product.id,
            unit_amount: plan.monthlyPrice,
            currency: 'usd',
            recurring: {
                interval: 'month',
            },
            metadata: {
                ...plan.metadata,
                billing_period: 'monthly',
            },
        })
        console.log(`   ✅ 月付价格已创建: ${monthlyPrice.id} ($${plan.monthlyPrice / 100}/月)`)
    } else {
        console.log(`   ⚠️  月付价格已存在: ${monthlyPrice.id}`)
    }

    // 查找或创建年付价格
    let yearlyPrice = existingMonthlyPrices.data.find(
        (p) => p.recurring?.interval === 'year' && p.unit_amount === plan.yearlyPrice
    )

    if (!yearlyPrice) {
        yearlyPrice = await stripe.prices.create({
            product: product.id,
            unit_amount: plan.yearlyPrice,
            currency: 'usd',
            recurring: {
                interval: 'year',
            },
            metadata: {
                ...plan.metadata,
                billing_period: 'yearly',
            },
        })
        console.log(`   ✅ 年付价格已创建: ${yearlyPrice.id} ($${plan.yearlyPrice / 100}/年)`)
    } else {
        console.log(`   ⚠️  年付价格已存在: ${yearlyPrice.id}`)
    }

    return {
        planId: plan.metadata.plan_id,
        productId: product.id,
        monthlyPriceId: monthlyPrice.id,
        yearlyPriceId: yearlyPrice.id,
    }
}

async function setupBillingPortal() {
    console.log('\n🔧 配置 Billing Portal...')

    try {
        await stripe.billingPortal.configurations.create({
            business_profile: {
                headline: 'Library Management System - Manage your subscription',
            },
            features: {
                subscription_cancel: {
                    enabled: true,
                    mode: 'at_period_end',
                },
                subscription_update: {
                    enabled: true,
                    default_allowed_updates: ['price', 'promotion_code'],
                    proration_behavior: 'create_prorations',
                },
                payment_method_update: {
                    enabled: true,
                },
                invoice_history: {
                    enabled: true,
                },
            },
            default_return_url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000/org/billing',
        })
        console.log('   ✅ Billing Portal 配置完成')
    } catch (error: unknown) {
        if (error instanceof Error && error.message.includes('already exists')) {
            console.log('   ⚠️  Billing Portal 配置已存在')
        } else {
            console.log('   ⚠️  Billing Portal 配置失败 (可能需要在 Dashboard 手动配置)')
        }
    }
}

async function main() {
    console.log('🚀 开始配置 Stripe...')
    console.log('==========================================')

    const isTestMode = STRIPE_SECRET_KEY.startsWith('sk_test_')
    console.log(`\n📋 模式: ${isTestMode ? '测试模式 (Test Mode)' : '生产模式 (Live Mode)'}`)

    const results: PriceResult[] = []

    // 创建所有产品和价格
    for (const plan of PLANS) {
        const result = await createProduct(plan)
        results.push(result)
    }

    // 配置 Billing Portal
    await setupBillingPortal()

    // 输出环境变量配置
    console.log('\n==========================================')
    console.log('✅ Stripe 配置完成！')
    console.log('\n📝 请将以下内容添加到 .env.local 文件:\n')

    const envSuffix = isTestMode ? '_TEST' : ''

    console.log('# Stripe Price IDs')
    for (const result of results) {
        const planName = result.planId.toUpperCase()
        console.log(`STRIPE_PRICE_${planName}_MONTHLY${envSuffix}=${result.monthlyPriceId}`)
        console.log(`STRIPE_PRICE_${planName}_YEARLY${envSuffix}=${result.yearlyPriceId}`)
    }

    console.log('\n# 完整的 .env.local 示例:')
    console.log('# ----------------------------------------')
    console.log(`STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}`)
    console.log(`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${STRIPE_SECRET_KEY.replace('sk_', 'pk_')}`)
    console.log('STRIPE_WEBHOOK_SECRET=whsec_xxx  # 运行 stripe listen 获取')
    console.log('')
    for (const result of results) {
        const planName = result.planId.toUpperCase()
        console.log(`STRIPE_PRICE_${planName}_MONTHLY${envSuffix}=${result.monthlyPriceId}`)
        console.log(`STRIPE_PRICE_${planName}_YEARLY${envSuffix}=${result.yearlyPriceId}`)
    }

    console.log('\n🔔 下一步:')
    console.log('1. 复制上面的环境变量到 .env.local')
    console.log('2. 运行 Stripe CLI 获取 Webhook Secret:')
    console.log('   stripe listen --forward-to localhost:3000/api/stripe/webhook')
    console.log('3. 启动开发服务器: npm run dev')
    console.log('4. 测试支付流程')
}

main().catch((error) => {
    console.error('\n❌ 错误:', error.message)
    process.exit(1)
})
