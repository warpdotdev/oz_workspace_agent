/**
 * WebSocket Manager for Real-Time Task Updates
 * 
 * NOTE: This is a placeholder implementation. To fully enable WebSocket support:
 * 
 * 1. Install socket.io:
 *    npm install socket.io socket.io-client
 * 
 * 2. Create a custom server (server.ts):
 *    import { createServer } from 'http';
 *    import { Server } from 'socket.io';
 *    import next from 'next';
 * 
 * 3. Update package.json scripts to use custom server:
 *    "dev": "tsx server.ts"
 * 
 * 4. Implement Socket.IO in this file with proper event handling
 * 
 * For now, this provides the interface that the API routes can use.
 */

export interface TaskUpdateEvent {
  type: 'task:created' | 'task:updated' | 'task:deleted';
  data: any;
  timestamp: string;
}

class WebSocketManager {
  private clients: Set<any> = new Set();
  private isInitialized = false;

  /**
   * Initialize WebSocket server
   * This should be called when setting up a custom server
   */
  initialize(io?: any) {
    if (this.isInitialized) {
      console.warn('WebSocket manager already initialized');
      return;
    }

    if (io) {
      // Socket.IO implementation
      io.on('connection', (socket: any) => {
        console.log('Client connected:', socket.id);
        this.clients.add(socket);

        // Handle client authentication
        socket.on('authenticate', (data: { userId: string }) => {
          socket.userId = data.userId;
          console.log('Client authenticated:', data.userId);
        });

        // Handle task subscription
        socket.on('subscribe:tasks', (data: { projectId?: string }) => {
          const room = data.projectId ? `project:${data.projectId}` : 'tasks:all';
          socket.join(room);
          console.log(`Client ${socket.id} subscribed to ${room}`);
        });

        socket.on('disconnect', () => {
          console.log('Client disconnected:', socket.id);
          this.clients.delete(socket);
        });
      });

      this.isInitialized = true;
    } else {
      console.warn(
        'WebSocket not initialized. Install socket.io and set up custom server to enable real-time updates.'
      );
    }
  }

  /**
   * Broadcast task update to all connected clients
   */
  broadcastTaskUpdate(event: TaskUpdateEvent) {
    if (!this.isInitialized) {
      console.log('WebSocket not initialized, skipping broadcast:', event.type);
      return;
    }

    // TODO: Implement actual broadcast when Socket.IO is set up
    // this.io?.emit('task:update', event);
    
    console.log('Broadcasting task update:', event);
  }

  /**
   * Send task update to specific room (e.g., project-specific)
   */
  broadcastToRoom(room: string, event: TaskUpdateEvent) {
    if (!this.isInitialized) {
      console.log('WebSocket not initialized, skipping room broadcast');
      return;
    }

    // TODO: Implement actual broadcast when Socket.IO is set up
    // this.io?.to(room).emit('task:update', event);
    
    console.log(`Broadcasting to room ${room}:`, event);
  }

  /**
   * Get number of connected clients
   */
  getClientCount(): number {
    return this.clients.size;
  }
}

// Export singleton instance
export const wsManager = new WebSocketManager();

/**
 * Helper function to broadcast task updates from API routes
 */
export function broadcastTaskUpdate(
  type: TaskUpdateEvent['type'],
  data: any,
  projectId?: string
) {
  const event: TaskUpdateEvent = {
    type,
    data,
    timestamp: new Date().toISOString(),
  };

  // Broadcast to all clients
  wsManager.broadcastTaskUpdate(event);

  // Also broadcast to project-specific room if projectId is provided
  if (projectId) {
    wsManager.broadcastToRoom(`project:${projectId}`, event);
  }
}

/**
 * Client-side WebSocket hook (for use in React components)
 * 
 * Usage:
 * ```typescript
 * import { useTaskUpdates } from '@/lib/websocket';
 * 
 * function TaskBoard() {
 *   const { isConnected } = useTaskUpdates({
 *     onTaskCreated: (task) => { ... },
 *     onTaskUpdated: (task) => { ... },
 *     onTaskDeleted: (taskId) => { ... },
 *   });
 * 
 *   return <div>...</div>;
 * }
 * ```
 */
export interface UseTaskUpdatesCallbacks {
  onTaskCreated?: (task: any) => void;
  onTaskUpdated?: (task: any) => void;
  onTaskDeleted?: (taskId: string) => void;
}

// NOTE: This is a placeholder. Implement with socket.io-client
export function useTaskUpdates(callbacks: UseTaskUpdatesCallbacks) {
  // TODO: Implement with socket.io-client
  // const [isConnected, setIsConnected] = useState(false);
  // 
  // useEffect(() => {
  //   const socket = io();
  //   
  //   socket.on('connect', () => setIsConnected(true));
  //   socket.on('disconnect', () => setIsConnected(false));
  //   
  //   socket.on('task:update', (event: TaskUpdateEvent) => {
  //     switch (event.type) {
  //       case 'task:created':
  //         callbacks.onTaskCreated?.(event.data);
  //         break;
  //       case 'task:updated':
  //         callbacks.onTaskUpdated?.(event.data);
  //         break;
  //       case 'task:deleted':
  //         callbacks.onTaskDeleted?.(event.data.id);
  //         break;
  //     }
  //   });
  //   
  //   return () => {
  //     socket.disconnect();
  //   };
  // }, []);
  // 
  // return { isConnected };

  console.warn('WebSocket client not implemented. Install socket.io-client to enable.');
  return { isConnected: false };
}
