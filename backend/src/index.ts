import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { config } from './config/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import agentRoutes from './routes/agents.js';
import taskRoutes from './routes/tasks.js';

// Create Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/tasks', taskRoutes);

// API documentation endpoint
app.get('/api', (_req, res) => {
  res.json({
    success: true,
    message: 'AI Agent Management Platform API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register a new user',
        'POST /api/auth/login': 'Login an existing user',
        'GET /api/auth/me': 'Get current user profile (requires auth)',
      },
      agents: {
        'GET /api/agents': 'List agents with pagination and filtering',
        'POST /api/agents': 'Create a new agent',
        'GET /api/agents/:id': 'Get an agent by ID',
        'PUT /api/agents/:id': 'Update an agent',
        'DELETE /api/agents/:id': 'Delete an agent',
        'POST /api/agents/:id/start': 'Start an agent',
        'POST /api/agents/:id/stop': 'Stop an agent',
        'POST /api/agents/:id/pause': 'Pause an agent',
        'POST /api/agents/:id/resume': 'Resume a paused agent',
        'GET /api/agents/:id/stats': 'Get agent statistics',
        'POST /api/agents/:id/capabilities': 'Add a capability to an agent',
        'DELETE /api/agents/:id/capabilities/:capabilityId': 'Remove a capability',
      },
      tasks: {
        'GET /api/tasks': 'List tasks with pagination and filtering',
        'GET /api/tasks/stats': 'Get task statistics',
        'POST /api/tasks': 'Create a new task',
        'GET /api/tasks/:id': 'Get a task by ID',
        'PUT /api/tasks/:id': 'Update a task',
        'PATCH /api/tasks/:id': 'Partial update a task',
        'DELETE /api/tasks/:id': 'Delete a task',
        'POST /api/tasks/:id/start': 'Start a task',
        'POST /api/tasks/:id/complete': 'Complete a task',
        'POST /api/tasks/:id/fail': 'Mark task as failed',
        'POST /api/tasks/:id/cancel': 'Cancel a task',
        'POST /api/tasks/:id/pause': 'Pause a task',
        'POST /api/tasks/:id/resume': 'Resume a paused task',
        'POST /api/tasks/:id/assign': 'Assign task to agent',
        'GET /api/tasks/:id/subtasks': 'Get subtasks',
      },
    },
  });
});

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  console.log(`
🚀 AI Agent Management Platform API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Environment: ${config.nodeEnv}
   Port: ${config.port}
   Health: http://localhost:${config.port}/health
   API Docs: http://localhost:${config.port}/api
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

// Graceful shutdown
const shutdown = () => {
  console.log('\nShutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;
