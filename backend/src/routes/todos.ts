import { Router, Request, Response } from 'express';
import db from '../db/database';

const router = Router();

interface Todo {
  id: number;
  title: string;
  completed: number;
  created_at: string;
  updated_at: string;
}

// Helper to convert database row to API format
const formatTodo = (row: Todo) => ({
  id: row.id,
  title: row.title,
  completed: Boolean(row.completed),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// GET /api/todos - List all todos with optional filter
router.get('/', (req: Request, res: Response) => {
  try {
    const filter = req.query.filter as string | undefined;
    
    let query = 'SELECT * FROM todos';
    const params: any[] = [];
    
    if (filter === 'active') {
      query += ' WHERE completed = 0';
    } else if (filter === 'completed') {
      query += ' WHERE completed = 1';
    }
    
    query += ' ORDER BY created_at DESC';
    
    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as Todo[];
    const todos = rows.map(formatTodo);
    
    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// POST /api/todos - Create a new todo
router.post('/', (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required and must be a non-empty string' });
    }
    
    const stmt = db.prepare(
      'INSERT INTO todos (title, completed, created_at, updated_at) VALUES (?, 0, datetime(\'now\'), datetime(\'now\'))'
    );
    const result = stmt.run(title.trim());
    
    const newTodo = db.prepare('SELECT * FROM todos WHERE id = ?').get(result.lastInsertRowid) as Todo;
    
    res.status(201).json(formatTodo(newTodo));
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// PUT /api/todos/:id - Update a todo
router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { title, completed } = req.body;
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid todo ID' });
    }
    
    // Check if todo exists
    const existing = db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as Todo | undefined;
    if (!existing) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    const updates: string[] = [];
    const params: any[] = [];
    
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: 'Title must be a non-empty string' });
      }
      updates.push('title = ?');
      params.push(title.trim());
    }
    
    if (completed !== undefined) {
      if (typeof completed !== 'boolean') {
        return res.status(400).json({ error: 'Completed must be a boolean' });
      }
      updates.push('completed = ?');
      params.push(completed ? 1 : 0);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    updates.push('updated_at = datetime(\'now\')');
    params.push(id);
    
    const query = `UPDATE todos SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...params);
    
    const updated = db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as Todo;
    res.json(formatTodo(updated));
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// DELETE /api/todos/:id - Delete a todo
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid todo ID' });
    }
    
    const result = db.prepare('DELETE FROM todos WHERE id = ?').run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// PATCH /api/todos/:id/toggle - Toggle completion status
router.patch('/:id/toggle', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid todo ID' });
    }
    
    // Check if todo exists
    const existing = db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as Todo | undefined;
    if (!existing) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    const newCompleted = existing.completed ? 0 : 1;
    db.prepare('UPDATE todos SET completed = ?, updated_at = datetime(\'now\') WHERE id = ?').run(newCompleted, id);
    
    const updated = db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as Todo;
    res.json(formatTodo(updated));
  } catch (error) {
    console.error('Error toggling todo:', error);
    res.status(500).json({ error: 'Failed to toggle todo' });
  }
});

export default router;
