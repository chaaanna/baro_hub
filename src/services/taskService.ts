import { Task, TaskStatus, Priority } from "../../types";
import { INITIAL_TASKS } from "../../constants";

// This service acts as an abstraction layer.
// Currently it uses in-memory mock data, but can be easily swapped 
// to use Firebase Firestore SDK without changing UI components.

let memoryTasks: Task[] = [...INITIAL_TASKS];

export const taskService = {
  getAllTasks: async (): Promise<Task[]> => {
    // Simulate network delay
    return new Promise((resolve) => {
      setTimeout(() => resolve([...memoryTasks]), 300);
    });
  },

  createTask: async (task: Task): Promise<Task> => {
    const newTask = { 
      ...task, 
      createdAt: Date.now(), 
      updatedAt: Date.now() 
    };
    memoryTasks = [...memoryTasks, newTask];
    return newTask;
  },

  updateTask: async (updatedTask: Task): Promise<Task> => {
    const taskIndex = memoryTasks.findIndex(t => t.id === updatedTask.id);
    if (taskIndex > -1) {
      const newVersion = { ...updatedTask, updatedAt: Date.now() };
      memoryTasks[taskIndex] = newVersion;
      memoryTasks = [...memoryTasks]; // trigger new reference
      return newVersion;
    }
    throw new Error("Task not found");
  },

  deleteTask: async (taskId: string): Promise<void> => {
    memoryTasks = memoryTasks.filter(t => t.id !== taskId);
  },

  updateStatus: async (taskId: string, status: TaskStatus): Promise<Task> => {
    const task = memoryTasks.find(t => t.id === taskId);
    if (task) {
      return await taskService.updateTask({ ...task, status });
    }
    throw new Error("Task not found");
  }
};