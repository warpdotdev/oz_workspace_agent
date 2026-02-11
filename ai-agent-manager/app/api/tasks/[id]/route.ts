import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

/**
 * API Error Response - Errors as first-class features
 */
interface ApiError {
  error: string;
  code: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

function errorResponse(
  message: string,
  code: string,
  status: number,
  details?: Record<string, unknown>
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      error: message,
      code,
      details,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

// Status transition rules - enforces valid workflow
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  TODO: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["TODO", "REVIEW", "DONE", "CANCELLED"],
  REVIEW: ["IN_PROGRESS", "DONE", "CANCELLED"],
  DONE: ["IN_PROGRESS"], // Allow reopening
  CANCELLED: ["TODO"], // Allow uncancelling
};

// Update schema with trust fields
const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  projectId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  agentId: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  // Trust calibration fields
  confidenceScore: z.number().min(0).max(1).optional().nullable(),
  reasoningLog: z.record(z.string(), z.unknown()).optional().nullable(),
  executionSteps: z.record(z.string(), z.unknown()).optional().nullable(),
  requiresReview: z.boolean().optional(),
  // Review action
  markAsReviewed: z.boolean().optional(),
  // Error handling
  errorMessage: z.string().optional().nullable(),
  errorCode: z.string().optional().nullable(),
  // Retry action
  retry: z.boolean().optional(),
});

/**
 * GET /api/tasks/[id] - Get single task with all details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { id } = await params;

    const task = await db.task.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true, image: true } },
        agent: { select: { id: true, name: true, type: true, status: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!task) {
      return errorResponse("Task not found", "TASK_NOT_FOUND", 404);
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("GET /api/tasks/[id] error:", error);
    return errorResponse(
      "Failed to fetch task",
      "FETCH_ERROR",
      500,
      { originalError: error instanceof Error ? error.message : "Unknown error" }
    );
  }
}

/**
 * PATCH /api/tasks/[id] - Update task with trust field support
 * Includes status transition validation and review actions
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { id } = await params;
    const body = await req.json();
    const validation = updateTaskSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        "Validation failed",
        "VALIDATION_ERROR",
        400,
        { errors: validation.error.flatten().fieldErrors }
      );
    }

    const data = validation.data;

    // Fetch current task
    const existingTask = await db.task.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
    });

    if (!existingTask) {
      return errorResponse("Task not found", "TASK_NOT_FOUND", 404);
    }

    // Validate status transition if status is changing
    if (data.status && data.status !== existingTask.status) {
      const validTransitions = VALID_STATUS_TRANSITIONS[existingTask.status];
      if (!validTransitions?.includes(data.status)) {
        return errorResponse(
          `Invalid status transition from ${existingTask.status} to ${data.status}`,
          "INVALID_STATUS_TRANSITION",
          400,
          { 
            currentStatus: existingTask.status, 
            attemptedStatus: data.status,
            validTransitions 
          }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    // Basic fields
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.projectId !== undefined) updateData.projectId = data.projectId;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
    if (data.agentId !== undefined) updateData.agentId = data.agentId;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;

    // Trust calibration fields
    if (data.confidenceScore !== undefined) {
      updateData.confidenceScore = data.confidenceScore;
      // Auto-flag for review if confidence drops below threshold
      if (data.confidenceScore !== null && data.confidenceScore < 0.5) {
        updateData.requiresReview = true;
      }
    }
    if (data.reasoningLog !== undefined) updateData.reasoningLog = data.reasoningLog;
    if (data.executionSteps !== undefined) updateData.executionSteps = data.executionSteps;
    if (data.requiresReview !== undefined) updateData.requiresReview = data.requiresReview;

    // Handle review action
    if (data.markAsReviewed) {
      updateData.reviewedAt = new Date();
      updateData.reviewedById = session.user.id;
      updateData.requiresReview = false;
    }

    // Error handling fields
    if (data.errorMessage !== undefined) updateData.errorMessage = data.errorMessage;
    if (data.errorCode !== undefined) updateData.errorCode = data.errorCode;

    // Handle retry action
    if (data.retry) {
      updateData.retryCount = existingTask.retryCount + 1;
      updateData.lastRetryAt = new Date();
      // Clear error on retry
      updateData.errorMessage = null;
      updateData.errorCode = null;
      // Reset to in progress
      updateData.status = "IN_PROGRESS";
    }

    const task = await db.task.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true, image: true } },
        agent: { select: { id: true, name: true, type: true, status: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error("PATCH /api/tasks/[id] error:", error);
    return errorResponse(
      "Failed to update task",
      "UPDATE_ERROR",
      500,
      { originalError: error instanceof Error ? error.message : "Unknown error" }
    );
  }
}

/**
 * DELETE /api/tasks/[id] - Delete task
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { id } = await params;

    // Verify ownership
    const existingTask = await db.task.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
    });

    if (!existingTask) {
      return errorResponse("Task not found", "TASK_NOT_FOUND", 404);
    }

    await db.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error("DELETE /api/tasks/[id] error:", error);
    return errorResponse(
      "Failed to delete task",
      "DELETE_ERROR",
      500,
      { originalError: error instanceof Error ? error.message : "Unknown error" }
    );
  }
}
