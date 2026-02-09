CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Trigger to update updated_at on row update
CREATE TRIGGER IF NOT EXISTS update_todos_timestamp
AFTER UPDATE ON todos
FOR EACH ROW
BEGIN
  UPDATE todos SET updated_at = datetime('now') WHERE id = OLD.id;
END;
