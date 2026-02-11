import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

/**
 * API Error Response - Errors as first-class features
 * Per product-lead: "Error states and reasoning fields are first-class features, not edge cases"
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

// Validation schema with trust fields
const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE", "CANCELLED"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  projectId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  agentId: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  // Trust calibration fields
  confidenceScore: z.number().min(0).max(1).optional().nullable(),
  reasoningLog: z.record(z.string(), z.unknown()).optional().nullable(),
  requiresReview: z.boolean().default(false),
});

/**
 * GET /api/tasks - List tasks with filtering
 * Includes trust fields for transparency
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse("Authentication required", "AUTH_REQUIRED", 401);
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const projectId = searchParams.get("projectId");
    const agentId = searchParams.get("agentId");
    const requiresReview = searchParams.get("requiresReview");
    const hasError = searchParams.get("hasError");

    // Build filter conditions
    const where: Record<string, unknown> = {
      createdById: session.user.id,
    };

    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }
    if (projectId) {
      where.projectId = projectId;
    }
    if (agentId) {
      where.agentId = agentId;
    }
    // Trust filters
    if (requiresReview === "true") {
      where.requiresReview = true;
    }
    if (hasError === "true") {
      where.errorMessage = { not: null };
    }

    const tasks = await db.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true, image: true } },
        agent: { select: { id: true, name: true, type: true, status: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: [
        { requiresReview: "desc" }, // Prioritize items needing review
        { priority: "desc" },
        { updatedAt: "desc" },
      ],
    });

    return NextResponse.json({
      tasks,
      meta: {
        total: tasks.length,
        needsReview: tasks.filter((t: { requiresReview: boolean }) => t.requiresReview).length,
        hasErrors: tasks.filter((t: { errorMessage: string | null }) => t.errorMessage).length,
      },
    });
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return errorResponse(
      "Failed to fetch tasks",
      "FETCH_ERROR",
      500,
      { originalError: error instanceof Error ? error.message : "Unknown error" }
    );
  }
}

/**
 * POST /api/tasks - Create a new task
 * Validates input and includes trust field initialization
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse("Authentication required", "AUTH_REQUIRED", 401);
    }

    const body = await req.json();
    const validation = createTaskSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        "Validation failed",
        "VALIDATION_ERROR",
        400,
        { errors: validation.error.flatten().fieldErrors }
      );
    }

    const data = validation.data;

    // Validate project ownership if projectId provided
    if (data.projectId) {
      const project = await db.project.findFirst({
        where: { id: data.projectId, userId: session.user.id },
      });
      if (!project) {
        return errorResponse("Project not found or access denied", "PROJECT_NOT_FOUND", 404);
      }
    }

    // Validate agent ownership if agentId provided
    if (data.agentId) {
      const agent = await db.agent.findFirst({
        where: { id: data.agentId, userId: session.user.id },
      });
      if (!agent) {
        return errorResponse("Agent not found or access denied", "AGENT_NOT_FOUND", 404);
      }
    }

    // Auto-flag for review if confidence is low
    const shouldRequireReview = 
      data.requiresReview || 
      (data.confidenceScore !== undefined && data.confidenceScore !== null && data.confidenceScore < 0.5);

    const task = await db.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        projectId: data.projectId,
        assigneeId: data.assigneeId,
        agentId: data.agentId,
        createdById: session.user.id,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        // Trust fields
        confidenceScore: data.confidenceScore ?? 0.5,
        reasoningLog: data.reasoningLog,
        requiresReview: shouldRequireReview,
        // Initialize error tracking
        retryCount: 0,
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true, image: true } },
        agent: { select: { id: true, name: true, type: true, status: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return errorResponse(
      "Failed to create task",
      "CREATE_ERROR",
      500,
      { originalError: error instanceof Error ? error.message : "Unknown error" }
    );
  }
}
