import { Router, Request, Response } from 'express';
import db from '../db/database';
import type { Todo, CreateTodoInput, UpdateTodoInput } from 'shared';

const router = Router();

// Helper to convert DB row to Todo
function rowToTodo(row: any): Todo {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /api/todos - List all todos
router.get('/', (req: Request, res: Response) => {
  const filter = req.query.filter as string | undefined;
  
  let query = 'SELECT * FROM todos';
  if (filter === 'active') {
    query += ' WHERE completed = 0';
  } else if (filter === 'completed') {
    query += ' WHERE completed = 1';
  }
  query += ' ORDER BY created_at DESC';
  
  const rows = db.prepare(query).all();
  const todos = rows.map(rowToTodo);
  res.json(todos);
});

// GET /api/todos/:id - Get single todo
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const row = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);
  
  if (!row) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  
  res.json(rowToTodo(row));
});

// POST /api/todos - Create new todo
router.post('/', (req: Request, res: Response) => {
  const { title } = req.body as CreateTodoInput;
  
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  const result = db.prepare('INSERT INTO todos (title) VALUES (?)').run(title.trim());
  const row = db.prepare('SELECT * FROM todos WHERE id = ?').get(result.lastInsertRowid);
  
  res.status(201).json(rowToTodo(row));
});

// PUT /api/todos/:id - Update todo
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, completed } = req.body as UpdateTodoInput;
  
  const existing = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Title must be a non-empty string' });
    }
    updates.push('title = ?');
    values.push(title.trim());
  }
  
  if (completed !== undefined) {
    updates.push('completed = ?');
    values.push(completed ? 1 : 0);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }
  
  values.push(id);
  db.prepare(`UPDATE todos SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  
  const row = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);
  res.json(rowToTodo(row));
});

// PATCH /api/todos/:id/toggle - Toggle completion status
router.patch('/:id/toggle', (req: Request, res: Response) => {
  const { id } = req.params;
  
  const existing = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  
  db.prepare('UPDATE todos SET completed = NOT completed WHERE id = ?').run(id);
  
  const row = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);
  res.json(rowToTodo(row));
});

// DELETE /api/todos/:id - Delete todo
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  
  const existing = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  
  db.prepare('DELETE FROM todos WHERE id = ?').run(id);
  res.status(204).send();
});

export default router;
