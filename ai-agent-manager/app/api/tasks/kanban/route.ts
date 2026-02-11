import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { taskService } from '@/lib/taskService';

/**
 * GET /api/tasks/kanban
 * Get tasks grouped by status for Kanban board view
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId') || undefined;

    const grouped = await taskService.getByStatus(projectId);

    return NextResponse.json({
      success: true,
      data: grouped,
    });
  } catch (error) {
    console.error('Error fetching kanban data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch kanban data' 
      },
      { status: 500 }
    );
  }
}
