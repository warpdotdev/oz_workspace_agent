import { Router, Request, Response } from 'express';
import db from '../db/database.js';
import type { Todo, CreateTodoInput, UpdateTodoInput, TodoFilter } from '../../../shared/types/todo.js';

const router = Router();

// Helper to convert DB row to Todo object
interface DbTodoRow {
  id: number;
  title: string;
  completed: number;
  created_at: string;
  updated_at: string;
}

function rowToTodo(row: DbTodoRow): Todo {
  return {
    id: row.id,
    title: row.title,
    completed: Boolean(row.completed),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /api/todos - List all todos with optional filter
router.get('/', (req: Request, res: Response) => {
  try {
    const filter = req.query.filter as TodoFilter | undefined;
    
    let query = 'SELECT * FROM todos';
    const params: number[] = [];
    
    if (filter === 'active') {
      query += ' WHERE completed = ?';
      params.push(0);
    } else if (filter === 'completed') {
      query += ' WHERE completed = ?';
      params.push(1);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as DbTodoRow[];
    const todos = rows.map(rowToTodo);
    
    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// GET /api/todos/:id - Get a single todo
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const stmt = db.prepare('SELECT * FROM todos WHERE id = ?');
    const row = stmt.get(Number(id)) as DbTodoRow | undefined;
    
    if (!row) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }
    
    res.json(rowToTodo(row));
  } catch (error) {
    console.error('Error fetching todo:', error);
    res.status(500).json({ error: 'Failed to fetch todo' });
  }
});

// POST /api/todos - Create a new todo
router.post('/', (req: Request, res: Response) => {
  try {
    const { title } = req.body as CreateTodoInput;
    
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ error: 'Title is required and must be a non-empty string' });
      return;
    }
    
    const stmt = db.prepare(
      'INSERT INTO todos (title) VALUES (?) RETURNING *'
    );
    const row = stmt.get(title.trim()) as DbTodoRow;
    
    res.status(201).json(rowToTodo(row));
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// PUT /api/todos/:id - Update a todo
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, completed } = req.body as UpdateTodoInput;
    
    // Check if todo exists
    const checkStmt = db.prepare('SELECT * FROM todos WHERE id = ?');
    const existing = checkStmt.get(Number(id));
    
    if (!existing) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }
    
    // Build dynamic update query
    const updates: string[] = [];
    const params: (string | number)[] = [];
    
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        res.status(400).json({ error: 'Title must be a non-empty string' });
        return;
      }
      updates.push('title = ?');
      params.push(title.trim());
    }
    
    if (completed !== undefined) {
      updates.push('completed = ?');
      params.push(completed ? 1 : 0);
    }
    
    if (updates.length === 0) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }
    
    updates.push("updated_at = datetime('now')");
    params.push(Number(id));
    
    const updateStmt = db.prepare(
      `UPDATE todos SET ${updates.join(', ')} WHERE id = ? RETURNING *`
    );
    const row = updateStmt.get(...params) as DbTodoRow;
    
    res.json(rowToTodo(row));
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// PATCH /api/todos/:id/toggle - Toggle todo completion status
router.patch('/:id/toggle', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const stmt = db.prepare(
      `UPDATE todos 
       SET completed = NOT completed, updated_at = datetime('now') 
       WHERE id = ? 
       RETURNING *`
    );
    const row = stmt.get(Number(id)) as DbTodoRow | undefined;
    
    if (!row) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }
    
    res.json(rowToTodo(row));
  } catch (error) {
    console.error('Error toggling todo:', error);
    res.status(500).json({ error: 'Failed to toggle todo' });
  }
});

// DELETE /api/todos/:id - Delete a todo
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const stmt = db.prepare('DELETE FROM todos WHERE id = ? RETURNING *');
    const row = stmt.get(Number(id)) as DbTodoRow | undefined;
    
    if (!row) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }
    
    res.json({ message: 'Todo deleted successfully', todo: rowToTodo(row) });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// DELETE /api/todos - Delete all completed todos
router.delete('/', (req: Request, res: Response) => {
  try {
    const stmt = db.prepare('DELETE FROM todos WHERE completed = 1');
    const result = stmt.run();
    
    res.json({ 
      message: 'Completed todos deleted successfully', 
      count: result.changes 
    });
  } catch (error) {
    console.error('Error deleting completed todos:', error);
    res.status(500).json({ error: 'Failed to delete completed todos' });
  }
});

export default router;
