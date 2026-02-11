import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { taskService } from '@/lib/taskService';

/**
 * GET /api/tasks/stats
 * Get task statistics grouped by status
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

    const stats = await taskService.getStatsByStatus(projectId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching task stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch task stats' 
      },
      { status: 500 }
    );
  }
}
