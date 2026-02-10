import { Router, Request, Response } from "express";
import db from "../db/database.js";

const router = Router();

// GET /api/todos - List all todos (with optional ?filter=active|completed)
router.get("/", (req: Request, res: Response) => {
  const { filter } = req.query;

  let rows;
  if (filter === "active") {
    rows = db.prepare("SELECT * FROM todos WHERE completed = 0 ORDER BY created_at DESC").all();
  } else if (filter === "completed") {
    rows = db.prepare("SELECT * FROM todos WHERE completed = 1 ORDER BY created_at DESC").all();
  } else {
    rows = db.prepare("SELECT * FROM todos ORDER BY created_at DESC").all();
  }

  const todos = (rows as any[]).map(mapRowToTodo);
  res.json(todos);
});

// POST /api/todos - Create a new todo
router.post("/", (req: Request, res: Response) => {
  const { title } = req.body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  const stmt = db.prepare(
    "INSERT INTO todos (title) VALUES (?)"
  );
  const result = stmt.run(title.trim());

  const todo = db.prepare("SELECT * FROM todos WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(mapRowToTodo(todo as any));
});

// PUT /api/todos/:id - Update a todo
router.put("/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, completed } = req.body;

  const existing = db.prepare("SELECT * FROM todos WHERE id = ?").get(Number(id));
  if (!existing) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }

  const updates: string[] = [];
  const values: any[] = [];

  if (title !== undefined) {
    if (typeof title !== "string" || title.trim().length === 0) {
      res.status(400).json({ error: "Title must be a non-empty string" });
      return;
    }
    updates.push("title = ?");
    values.push(title.trim());
  }

  if (completed !== undefined) {
    updates.push("completed = ?");
    values.push(completed ? 1 : 0);
  }

  if (updates.length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  updates.push("updated_at = datetime('now')");
  values.push(Number(id));

  db.prepare(`UPDATE todos SET ${updates.join(", ")} WHERE id = ?`).run(...values);

  const updated = db.prepare("SELECT * FROM todos WHERE id = ?").get(Number(id));
  res.json(mapRowToTodo(updated as any));
});

// DELETE /api/todos/:id - Delete a todo
router.delete("/:id", (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = db.prepare("SELECT * FROM todos WHERE id = ?").get(Number(id));
  if (!existing) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }

  db.prepare("DELETE FROM todos WHERE id = ?").run(Number(id));
  res.status(204).send();
});

// PATCH /api/todos/:id/toggle - Toggle completion status
router.patch("/:id/toggle", (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = db.prepare("SELECT * FROM todos WHERE id = ?").get(Number(id)) as any;
  if (!existing) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }

  const newCompleted = existing.completed ? 0 : 1;
  db.prepare("UPDATE todos SET completed = ?, updated_at = datetime('now') WHERE id = ?").run(
    newCompleted,
    Number(id)
  );

  const updated = db.prepare("SELECT * FROM todos WHERE id = ?").get(Number(id));
  res.json(mapRowToTodo(updated as any));
});

// Map DB row to Todo interface shape
function mapRowToTodo(row: any) {
  return {
    id: row.id,
    title: row.title,
    completed: Boolean(row.completed),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default router;
