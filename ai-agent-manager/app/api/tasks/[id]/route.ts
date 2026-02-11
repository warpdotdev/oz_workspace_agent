import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { taskService } from '@/lib/taskService';
import { broadcastTaskUpdate } from '@/lib/websocket';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tasks/:id
 * Get a task by ID
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const task = await taskService.getById(id, session.user.id);

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch task' 
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tasks/:id
 * Update a task
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    const task = await taskService.update(id, body, session.user.id);

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Broadcast task update via WebSocket
    broadcastTaskUpdate('task:updated', task, task.projectId || undefined);

    return NextResponse.json({
      success: true,
      data: task,
      message: 'Task updated successfully',
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update task' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    
    // Get task before deletion to access projectId
    const task = await taskService.getById(id, session.user.id);
    
    const success = await taskService.delete(id, session.user.id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Broadcast task deletion via WebSocket
    broadcastTaskUpdate('task:deleted', { id }, task?.projectId || undefined);

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete task' 
      },
      { status: 500 }
    );
  }
}
