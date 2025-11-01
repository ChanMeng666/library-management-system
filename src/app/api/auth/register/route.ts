import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// 使用 service role key 来绕过 RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(request: NextRequest) {
    try {
        const { email, password, username, fullName } = await request.json();

        // 1. 创建 Supabase Auth 用户
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // 自动确认邮箱
            user_metadata: {
                username,
                full_name: fullName
            }
        });

        if (authError) {
            console.error('Auth error:', authError);
            return NextResponse.json(
                { error: authError.message },
                { status: 400 }
            );
        }

        if (!authData.user) {
            return NextResponse.json(
                { error: 'Failed to create user' },
                { status: 500 }
            );
        }

        // 2. 在 users 表中创建用户记录
        const { error: profileError } = await supabaseAdmin
            .from('users')
            .insert({
                user_id: authData.user.id,
                email: email,
                username: username,
                full_name: fullName,
                password_hash: 'supabase_auth_managed',
                membership_type: 'basic'
            });

        if (profileError) {
            console.error('Profile creation error:', profileError);
            // 如果创建资料失败，删除 auth 用户
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            return NextResponse.json(
                { error: 'Failed to create user profile' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            user: {
                id: authData.user.id,
                email: authData.user.email
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
