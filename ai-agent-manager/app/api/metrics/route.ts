import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { calculateTrustMetrics, calculateAgentTrustMetrics } from '@/lib/trust-metrics'

/**
 * GET /api/metrics
 * Get trust metrics for the authenticated user
 * 
 * Per @product-lead guidance, these metrics are critical:
 * - False confidence rate: Tasks marked high confidence but requiring human correction
 * - Task retry velocity: Time from failure to retry completion
 * 
 * Returns both aggregate metrics and per-agent breakdown
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [trustMetrics, agentMetrics] = await Promise.all([
      calculateTrustMetrics(session.user.id),
      calculateAgentTrustMetrics(session.user.id),
    ])

    return NextResponse.json({
      aggregate: trustMetrics,
      byAgent: agentMetrics,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('GET /api/metrics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
