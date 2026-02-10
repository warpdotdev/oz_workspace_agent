import { Todo, FilterType } from "../types/todo";

const API_BASE = "/api/todos";

export async function fetchTodos(filter: FilterType = "all"): Promise<Todo[]> {
  const res = await fetch(`${API_BASE}?filter=${filter}`);
  if (!res.ok) throw new Error("Failed to fetch todos");
  return res.json();
}

export async function createTodo(title: string): Promise<Todo> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to create todo");
  return res.json();
}

export async function updateTodo(id: number, data: { title?: string; completed?: boolean }): Promise<Todo> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update todo");
  return res.json();
}

export async function deleteTodo(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete todo");
}

export async function toggleTodo(id: number): Promise<Todo> {
  const res = await fetch(`${API_BASE}/${id}/toggle`, { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to toggle todo");
  return res.json();
}
