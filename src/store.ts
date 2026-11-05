import { openDB } from "idb";
export type Task = {
  id: string;
  title: string;
  notes: string;
  due: string;
  priority: "low" | "medium" | "high";
  done: boolean;
  created: number;
};
const db = openDB("daylight", 1, {
  upgrade(db) {
    db.createObjectStore("tasks", { keyPath: "id" });
  },
});
export const readTasks = async (): Promise<Task[]> =>
  (await db).getAll("tasks");
export const saveTask = async (task: Task) => (await db).put("tasks", task);
export const removeTask = async (id: string) => (await db).delete("tasks", id);
