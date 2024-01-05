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
    console.log(`Serializing task ${this.id} of type ${this.type}`);
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
    console.log(`Deserializing task ${taskData.id} of type ${taskData.type}`);
    const location = new RoomPosition(taskData.location.x, taskData.location.y, taskData.location.roomName);
    return new Task(taskData.type, taskData.priority, location, taskData.id);
  }

  // Method to check if a creep is suitable for this task.
  isSuitableFor(creep: Creep): boolean {
    const isSuitable = creep.memory.role === "worker" && creep.room.name === this.location.roomName;
    console.log(`Checking if creep ${creep.name} is suitable for task ${this.id}: ${isSuitable}`);
    return isSuitable;
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

  addTask(task: Task): void {
    console.log(`Adding Task to Memory: ${task.id}`);
    Memory.tasks.push(task.serialize());
  }

  getTasks(): Task[] {
    console.log("Retrieving all tasks from Memory");
    return Memory.tasks.map(Task.deserialize);
  }

  getTaskForCreep(creep: Creep): Task | undefined {
    console.log(`Retrieving suitable task for Creep: ${creep.name}`);
    return this.getTasks().find(task => task.isSuitableFor(creep));
  }

  completeTask(taskIndex: number): void {
    console.log(`Completing Task at index: ${taskIndex}`);
    Memory.tasks.splice(taskIndex, 1);
  }

  prioritizeTasks(): void {
    console.log("Prioritizing tasks");
    const tasks = this.getTasks();
    tasks.sort((a, b) => a.priority - b.priority);
    Memory.tasks = tasks.map(task => task.serialize());
  }
}
