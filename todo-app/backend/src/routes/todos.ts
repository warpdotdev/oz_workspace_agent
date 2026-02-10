import { Router, Request, Response } from "express";
import db from "../db/database";
import { TodoRow, rowToTodo } from "../types/todo";

const router = Router();

// GET /api/todos - List all todos (optional ?filter=all|active|completed)
router.get("/", (req: Request, res: Response) => {
  const filter = (req.query.filter as string) || "all";

  let rows: TodoRow[];
  if (filter === "active") {
    rows = db.prepare("SELECT * FROM todos WHERE completed = 0 ORDER BY created_at DESC").all() as TodoRow[];
  } else if (filter === "completed") {
    rows = db.prepare("SELECT * FROM todos WHERE completed = 1 ORDER BY created_at DESC").all() as TodoRow[];
  } else {
    rows = db.prepare("SELECT * FROM todos ORDER BY created_at DESC").all() as TodoRow[];
  }

  res.json(rows.map(rowToTodo));
});

// POST /api/todos - Create a new todo
router.post("/", (req: Request, res: Response) => {
  const { title } = req.body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  const stmt = db.prepare("INSERT INTO todos (title) VALUES (?)");
  const result = stmt.run(title.trim());

  const row = db.prepare("SELECT * FROM todos WHERE id = ?").get(result.lastInsertRowid) as TodoRow;
  res.status(201).json(rowToTodo(row));
});

// PUT /api/todos/:id - Update a todo
router.put("/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, completed } = req.body;

  const existing = db.prepare("SELECT * FROM todos WHERE id = ?").get(id) as TodoRow | undefined;
  if (!existing) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }

  const newTitle = title !== undefined ? title.trim() : existing.title;
  const newCompleted = completed !== undefined ? (completed ? 1 : 0) : existing.completed;

  db.prepare("UPDATE todos SET title = ?, completed = ?, updated_at = datetime('now') WHERE id = ?")
    .run(newTitle, newCompleted, id);

  const row = db.prepare("SELECT * FROM todos WHERE id = ?").get(id) as TodoRow;
  res.json(rowToTodo(row));
});

// DELETE /api/todos/:id - Delete a todo
router.delete("/:id", (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = db.prepare("SELECT * FROM todos WHERE id = ?").get(id) as TodoRow | undefined;
  if (!existing) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }

  db.prepare("DELETE FROM todos WHERE id = ?").run(id);
  res.status(204).send();
});

// PATCH /api/todos/:id/toggle - Toggle completion status
router.patch("/:id/toggle", (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = db.prepare("SELECT * FROM todos WHERE id = ?").get(id) as TodoRow | undefined;
  if (!existing) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }

  const newCompleted = existing.completed === 1 ? 0 : 1;
  db.prepare("UPDATE todos SET completed = ?, updated_at = datetime('now') WHERE id = ?")
    .run(newCompleted, id);

  const row = db.prepare("SELECT * FROM todos WHERE id = ?").get(id) as TodoRow;
  res.json(rowToTodo(row));
});

export default router;
