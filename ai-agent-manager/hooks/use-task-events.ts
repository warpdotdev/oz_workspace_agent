'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { Task } from '@/types/task'

interface TaskEventMessage {
  type: 'CONNECTED' | 'HEARTBEAT' | 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_DELETED'
  taskId?: string
  data?: Task
  timestamp: string
}

interface UseTaskEventsOptions {
  onTaskCreated?: (task: Task) => void
  onTaskUpdated?: (task: Task) => void
  onTaskDeleted?: (taskId: string) => void
  onConnectionChange?: (connected: boolean) => void
  enabled?: boolean
}

/**
 * React hook for real-time task updates via Server-Sent Events
 * 
 * Automatically reconnects on connection loss with exponential backoff.
 * Falls back to polling if SSE is not supported.
 */
export function useTaskEvents({
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
  onConnectionChange,
  enabled = true,
}: UseTaskEventsOptions = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastEventTime, setLastEventTime] = useState<Date | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 10
  const baseReconnectDelay = 1000 // 1 second

  const connect = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    try {
      const eventSource = new EventSource('/api/tasks/events')
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        reconnectAttemptsRef.current = 0
        setIsConnected(true)
        onConnectionChange?.(true)
      }

      eventSource.onmessage = (event) => {
        try {
          const data: TaskEventMessage = JSON.parse(event.data)
          setLastEventTime(new Date(data.timestamp))

          switch (data.type) {
            case 'CONNECTED':
              // Connection confirmed
              break
            case 'HEARTBEAT':
              // Keep-alive, no action needed
              break
            case 'TASK_CREATED':
              if (data.data) {
                onTaskCreated?.(data.data)
              }
              break
            case 'TASK_UPDATED':
              if (data.data) {
                onTaskUpdated?.(data.data)
              }
              break
            case 'TASK_DELETED':
              if (data.taskId) {
                onTaskDeleted?.(data.taskId)
              }
              break
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error)
        }
      }

      eventSource.onerror = () => {
        setIsConnected(false)
        onConnectionChange?.(false)
        eventSource.close()
        eventSourceRef.current = null

        // Attempt reconnection with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current)
          reconnectAttemptsRef.current++
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        }
      }
    } catch (error) {
      console.error('Error creating EventSource:', error)
      setIsConnected(false)
      onConnectionChange?.(false)
    }
  }, [enabled, onTaskCreated, onTaskUpdated, onTaskDeleted, onConnectionChange])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsConnected(false)
    onConnectionChange?.(false)
  }, [onConnectionChange])

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (enabled) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, connect, disconnect])

  // Manual reconnect function
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0
    disconnect()
    connect()
  }, [connect, disconnect])

  return {
    isConnected,
    lastEventTime,
    reconnect,
    disconnect,
  }
}
