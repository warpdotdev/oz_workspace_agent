// WebSocket client for real-time task updates

type TaskEventType = 'task:created' | 'task:updated' | 'task:deleted';

interface TaskEvent {
  type: TaskEventType;
  data: Record<string, unknown>;
}

type TaskEventHandler = (event: TaskEvent) => void;

class TaskWebSocketClient {
  private ws: WebSocket | null = null;
  private handlers: Map<TaskEventType, Set<TaskEventHandler>> = new Map();
  private reconnectTimeout: number = 1000;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor(private url: string = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001') {}

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const taskEvent: TaskEvent = JSON.parse(event.data);
          this.emit(taskEvent);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.attemptReconnect();
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectTimeout * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms...`);
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  on(eventType: TaskEventType, handler: TaskEventHandler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
  }

  off(eventType: TaskEventType, handler: TaskEventHandler) {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emit(event: TaskEvent) {
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      handlers.forEach((handler) => handler(event));
    }
  }

  send(event: TaskEvent) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    } else {
      console.warn('WebSocket is not connected');
    }
  }
}

export const taskWebSocket = new TaskWebSocketClient();

// Hook for using WebSocket in React components
export function useTaskWebSocket() {
  const connect = () => taskWebSocket.connect();
  const disconnect = () => taskWebSocket.disconnect();
  const on = (eventType: TaskEventType, handler: TaskEventHandler) => 
    taskWebSocket.on(eventType, handler);
  const off = (eventType: TaskEventType, handler: TaskEventHandler) => 
    taskWebSocket.off(eventType, handler);

  return { connect, disconnect, on, off };
}
