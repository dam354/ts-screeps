// The Task class represents a task that a Creep can perform.
export class Task {
  // The type of the task.
  type: string;
  // The priority of the task. Lower numbers mean higher priority.
  priority: number;
  // The location where the task should be performed.
  location: RoomPosition;
  // The unique identifier of the task.
  id: string;

  // The constructor for the Task class.
  constructor(type: string, priority: number, location: RoomPosition, id: string) {
    this.type = type;
    this.priority = priority;
    this.location = location;
    this.id = id;
  }

  // Method to convert the task into a string for storage in Memory.
  serialize(): string {
    return JSON.stringify({
      type: this.type,
      priority: this.priority,
      location: { x: this.location.x, y: this.location.y, roomName: this.location.roomName },
      id: this.id
    });
  }

  // Static method to convert a string from Memory back into a Task object.
  static deserialize(data: string): Task {
    const taskData = JSON.parse(data);
    const location = new RoomPosition(taskData.location.x, taskData.location.y, taskData.location.roomName);
    return new Task(taskData.type, taskData.priority, location, taskData.id);
  }

  // Method to check if a creep is suitable for this task.
  isSuitableFor(creep: Creep): boolean {
    return creep.memory.role === "worker" && creep.room.name === this.location.roomName;
  }
}

// The TaskManager class manages all tasks.
export class TaskManager {
  // The constructor for the TaskManager class.
  constructor() {
    // Initialize the tasks in Memory if they don't exist yet.
    if (!Memory.tasks) {
      Memory.tasks = [];
    }
  }

  // Method to add a task to Memory.
  addTask(task: Task): void {
    Memory.tasks.push(task.serialize());
  }

  // Method to get all tasks from Memory.
  getTasks(): Task[] {
    return Memory.tasks.map(Task.deserialize);
  }

  // Method to get a suitable task for a specific creep.
  getTaskForCreep(creep: Creep): Task | undefined {
    return this.getTasks().find(task => task.isSuitableFor(creep));
  }

  // Method to remove a task from Memory.
  completeTask(taskIndex: number): void {
    Memory.tasks.splice(taskIndex, 1);
  }

  // Method to sort tasks by priority.
  prioritizeTasks(): void {
    const tasks = this.getTasks();
    tasks.sort((a, b) => a.priority - b.priority);
    Memory.tasks = tasks.map(task => task.serialize());
  }
}
