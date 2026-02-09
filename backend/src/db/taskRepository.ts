import { v4 as uuidv4 } from 'uuid';
import db from './database';
import { Task, CreateTaskInput, UpdateTaskInput, TaskRow, rowToTask } from '../models/Task';

export class TaskRepository {
  // Get all tasks
  findAll(): Task[] {
    const stmt = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC');
    const rows = stmt.all() as TaskRow[];
    return rows.map(rowToTask);
  }

  // Get tasks filtered by completed status
  findByCompleted(completed: boolean): Task[] {
    const stmt = db.prepare('SELECT * FROM tasks WHERE completed = ? ORDER BY created_at DESC');
    const rows = stmt.all(completed ? 1 : 0) as TaskRow[];
    return rows.map(rowToTask);
  }

  // Get a single task by ID
  findById(id: string): Task | null {
    const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
    const row = stmt.get(id) as TaskRow | undefined;
    return row ? rowToTask(row) : null;
  }

  // Create a new task
  create(input: CreateTaskInput): Task {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO tasks (id, title, description, completed, created_at, updated_at)
      VALUES (?, ?, ?, 0, ?, ?)
    `);
    
    stmt.run(id, input.title, input.description || null, now, now);
    
    return this.findById(id)!;
  }

  // Update an existing task
  update(id: string, input: UpdateTaskInput): Task | null {
    const existing = this.findById(id);
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (input.title !== undefined) {
      updates.push('title = ?');
      values.push(input.title);
    }
    if (input.description !== undefined) {
      updates.push('description = ?');
      values.push(input.description);
    }
    if (input.completed !== undefined) {
      updates.push('completed = ?');
      values.push(input.completed ? 1 : 0);
    }

    if (updates.length === 0) {
      return existing;
    }

    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);

    const stmt = db.prepare(`
      UPDATE tasks SET ${updates.join(', ')} WHERE id = ?
    `);
    
    stmt.run(...values);
    
    return this.findById(id);
  }

  // Delete a task
  delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}

// Export singleton instance
export const taskRepository = new TaskRepository();
