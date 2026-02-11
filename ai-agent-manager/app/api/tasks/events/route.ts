import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { taskEventEmitter, TaskEvent } from '@/lib/task-events'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Server-Sent Events endpoint for real-time task updates
 * 
 * Clients connect to this endpoint to receive live updates when tasks
 * are created, updated, or deleted. Uses SSE for browser compatibility.
 */
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const userId = session.user.id

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      // Send initial connection message
      const connectMessage = `data: ${JSON.stringify({ 
        type: 'CONNECTED', 
        timestamp: new Date().toISOString() 
      })}\n\n`
      controller.enqueue(encoder.encode(connectMessage))

      // Subscribe to task events for this user
      const unsubscribe = taskEventEmitter.subscribe(userId, (event: TaskEvent) => {
        try {
          const message = `data: ${JSON.stringify({
            type: event.type,
            taskId: event.taskId,
            data: event.data,
            timestamp: event.timestamp.toISOString(),
          })}\n\n`
          controller.enqueue(encoder.encode(message))
        } catch (error) {
          console.error('Error sending SSE message:', error)
        }
      })

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = `data: ${JSON.stringify({ 
            type: 'HEARTBEAT', 
            timestamp: new Date().toISOString() 
          })}\n\n`
          controller.enqueue(encoder.encode(heartbeat))
        } catch {
          // Connection closed, clean up
          clearInterval(heartbeatInterval)
          unsubscribe()
        }
      }, 30000)

      // Clean up on abort
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval)
        unsubscribe()
        try {
          controller.close()
        } catch {
          // Controller may already be closed
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  })
}
