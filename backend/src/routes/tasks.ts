import { Router, Request, Response } from 'express';
import { taskRepository } from '../db/taskRepository';
import { CreateTaskInput, UpdateTaskInput } from '../models/Task';

const router = Router();

// GET /api/tasks - Get all tasks
// Query params: ?completed=true|false (optional filter)
router.get('/', (req: Request, res: Response) => {
  try {
    const { completed } = req.query;
    
    let tasks;
    if (completed === 'true') {
      tasks = taskRepository.findByCompleted(true);
    } else if (completed === 'false') {
      tasks = taskRepository.findByCompleted(false);
    } else {
      tasks = taskRepository.findAll();
    }
    
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/:id - Get a single task
router.get('/:id', (req: Request, res: Response) => {
  try {
    const task = taskRepository.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /api/tasks - Create a new task
router.post('/', (req: Request, res: Response) => {
  try {
    const input: CreateTaskInput = req.body;
    
    // Validate required fields
    if (!input.title || typeof input.title !== 'string' || input.title.trim() === '') {
      return res.status(400).json({ error: 'Title is required and must be a non-empty string' });
    }
    
    const task = taskRepository.create({
      title: input.title.trim(),
      description: input.description?.trim(),
    });
    
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - Update a task
router.put('/:id', (req: Request, res: Response) => {
  try {
    const input: UpdateTaskInput = req.body;
    
    // Validate title if provided
    if (input.title !== undefined && (typeof input.title !== 'string' || input.title.trim() === '')) {
      return res.status(400).json({ error: 'Title must be a non-empty string' });
    }
    
    // Validate completed if provided
    if (input.completed !== undefined && typeof input.completed !== 'boolean') {
      return res.status(400).json({ error: 'Completed must be a boolean' });
    }
    
    const updateData: UpdateTaskInput = {};
    if (input.title !== undefined) updateData.title = input.title.trim();
    if (input.description !== undefined) updateData.description = input.description.trim();
    if (input.completed !== undefined) updateData.completed = input.completed;
    
    const task = taskRepository.update(req.params.id, updateData);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const deleted = taskRepository.delete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
