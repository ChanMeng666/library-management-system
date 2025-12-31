import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * Health Check API Endpoint
 *
 * This endpoint is used by GitHub Actions to keep the Supabase
 * free tier database active and prevent auto-pause.
 *
 * GET /api/health/ping - Ping the database and return health status
 */

// Create Supabase admin client with service role key
function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase environment variables')
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}

export async function GET() {
    const startTime = Date.now()

    try {
        const supabase = createAdminClient()

        // Call the ping() RPC function
        const { data, error } = await supabase.rpc('ping', {
            p_agent_info: 'API Health Check'
        })

        if (error) {
            console.error('Ping RPC error:', error)
            return NextResponse.json(
                {
                    status: 'error',
                    message: error.message,
                    timestamp: new Date().toISOString()
                },
                { status: 500 }
            )
        }

        const responseTime = Date.now() - startTime

        return NextResponse.json({
            status: 'ok',
            message: 'Database is alive',
            timestamp: new Date().toISOString(),
            response_time_ms: responseTime,
            database_response: data
        })
    } catch (error) {
        console.error('Health check error:', error)
        return NextResponse.json(
            {
                status: 'error',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        )
    }
}

// Also support POST for flexibility with external services
export async function POST() {
    return GET()
}
