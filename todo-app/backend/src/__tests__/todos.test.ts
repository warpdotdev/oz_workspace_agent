import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { TodoRow, rowToTodo } from "../types/todo";

// Use an in-memory database for tests
const schemaPath = path.join(__dirname, "../db/schema.sql");
const schema = fs.readFileSync(schemaPath, "utf-8");

describe("Todo CRUD operations", () => {
  let db: InstanceType<typeof Database>;

  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(schema);
  });

  afterEach(() => {
    db.close();
  });

  test("should create a todo", () => {
    const stmt = db.prepare("INSERT INTO todos (title) VALUES (?)");
    const result = stmt.run("Test todo");

    expect(result.changes).toBe(1);
    expect(result.lastInsertRowid).toBeDefined();

    const row = db.prepare("SELECT * FROM todos WHERE id = ?").get(result.lastInsertRowid) as TodoRow;
    expect(row.title).toBe("Test todo");
    expect(row.completed).toBe(0);
  });

  test("should list all todos", () => {
    db.prepare("INSERT INTO todos (title) VALUES (?)").run("Todo 1");
    db.prepare("INSERT INTO todos (title) VALUES (?)").run("Todo 2");

    const rows = db.prepare("SELECT * FROM todos ORDER BY created_at DESC").all() as TodoRow[];
    expect(rows).toHaveLength(2);
  });

  test("should update a todo", () => {
    const result = db.prepare("INSERT INTO todos (title) VALUES (?)").run("Original");
    const id = result.lastInsertRowid;

    db.prepare("UPDATE todos SET title = ?, completed = ?, updated_at = datetime('now') WHERE id = ?")
      .run("Updated", 1, id);

    const row = db.prepare("SELECT * FROM todos WHERE id = ?").get(id) as TodoRow;
    expect(row.title).toBe("Updated");
    expect(row.completed).toBe(1);
  });

  test("should delete a todo", () => {
    const result = db.prepare("INSERT INTO todos (title) VALUES (?)").run("To delete");
    const id = result.lastInsertRowid;

    db.prepare("DELETE FROM todos WHERE id = ?").run(id);

    const row = db.prepare("SELECT * FROM todos WHERE id = ?").get(id);
    expect(row).toBeUndefined();
  });

  test("should toggle completion status", () => {
    const result = db.prepare("INSERT INTO todos (title) VALUES (?)").run("Toggle me");
    const id = result.lastInsertRowid;

    let row = db.prepare("SELECT * FROM todos WHERE id = ?").get(id) as TodoRow;
    expect(row.completed).toBe(0);

    const newCompleted = row.completed === 1 ? 0 : 1;
    db.prepare("UPDATE todos SET completed = ?, updated_at = datetime('now') WHERE id = ?")
      .run(newCompleted, id);

    row = db.prepare("SELECT * FROM todos WHERE id = ?").get(id) as TodoRow;
    expect(row.completed).toBe(1);
  });

  test("should filter active todos", () => {
    db.prepare("INSERT INTO todos (title, completed) VALUES (?, ?)").run("Active", 0);
    db.prepare("INSERT INTO todos (title, completed) VALUES (?, ?)").run("Done", 1);

    const rows = db.prepare("SELECT * FROM todos WHERE completed = 0").all() as TodoRow[];
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Active");
  });

  test("should filter completed todos", () => {
    db.prepare("INSERT INTO todos (title, completed) VALUES (?, ?)").run("Active", 0);
    db.prepare("INSERT INTO todos (title, completed) VALUES (?, ?)").run("Done", 1);

    const rows = db.prepare("SELECT * FROM todos WHERE completed = 1").all() as TodoRow[];
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Done");
  });

  test("rowToTodo converts row correctly", () => {
    const row: TodoRow = {
      id: 1,
      title: "Test",
      completed: 1,
      created_at: "2024-01-01 00:00:00",
      updated_at: "2024-01-01 00:00:00",
    };

    const todo = rowToTodo(row);
    expect(todo.id).toBe(1);
    expect(todo.title).toBe("Test");
    expect(todo.completed).toBe(true);
    expect(todo.createdAt).toBe("2024-01-01 00:00:00");
    expect(todo.updatedAt).toBe("2024-01-01 00:00:00");
  });
});
