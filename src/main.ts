import { ErrorMapper } from "utils/ErrorMapper";

// Memory and Creep Extensions
declare global {
  interface Memory {
    uuid: number;
    log: any;
    tasks: string[];
  }

  interface CreepMemory {
    role: string;
    room: string;
    working: boolean;
  }

  interface Creep {
    findEnergySource(): Source | null;
    performTask(task: Task): void;
    performHarvestTask(task: Task): void;
    performUpgradeTask(task: Task): void;
    deliverEnergy(): void;
  }

  namespace NodeJS {
    interface Global {
      log: any;
    }
  }
}

// Task class
class Task {
  type: string;
  priority: number;
  location: RoomPosition;
  id: string;

  constructor(type: string, priority: number, location: RoomPosition, id: string) {
    this.type = type;
    this.priority = priority;
    this.location = location;
    this.id = id;
  }

  serialize(): string {

    return JSON.stringify({
      type: this.type,
      priority: this.priority,
      location: { x: this.location.x, y: this.location.y, roomName: this.location.roomName },
      id: this.id,
    });
  }

  static deserialize(data: string): Task {
    const taskData = JSON.parse(data);
    // Properly handle deserialization of RoomPosition
    const location = new RoomPosition(taskData.location.x, taskData.location.y, taskData.location.roomName);
    return new Task(taskData.type, taskData.priority, location, taskData.id);
  }


  isSuitableFor(creep: Creep): boolean {
    return creep.memory.role === 'worker' && creep.room.name === this.location.roomName;
  }
}

// Task Manager class
class TaskManager {
  constructor() {
    if (!Memory.tasks) {
      Memory.tasks = [];
    }
  }

  addTask(task: Task): void {
    Memory.tasks.push(task.serialize());
  }

  getTasks(): Task[] {
    return Memory.tasks.map(Task.deserialize);
  }

  getTaskForCreep(creep: Creep): Task | undefined {
    return this.getTasks().find(task => task.isSuitableFor(creep));
  }

  completeTask(taskIndex: number): void {
    Memory.tasks.splice(taskIndex, 1);
  }

  prioritizeTasks(): void {
    const tasks = this.getTasks();
    tasks.sort((a, b) => a.priority - b.priority);
    Memory.tasks = tasks.map(task => task.serialize());
  }
}

// Creep prototype extensions
Creep.prototype.findEnergySource = function(): Source | null {
  return this.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
};

Creep.prototype.performTask = function(task: Task): void {
  switch (task.type) {
    case 'harvest':
      this.performHarvestTask(task);
      break;
    case 'upgrade':
      this.performUpgradeTask(task);
      break;
    // Additional cases for other task types
  }
};

Creep.prototype.performHarvestTask = function(task: Task): void {
  if (this.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    const source = Game.getObjectById<Source>(task.id);
    if (source && this.harvest(source) === ERR_NOT_IN_RANGE) {
      this.moveTo(source);
    }
  } else {
    this.deliverEnergy();
  }
};

Creep.prototype.performUpgradeTask = function(task: Task): void {
  const controller = Game.rooms[task.location.roomName].controller;
  if (controller && this.upgradeController(controller) === ERR_NOT_IN_RANGE) {
    this.moveTo(controller);
  }
};

Creep.prototype.deliverEnergy = function(): void {
  const target = this.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: (structure) => {
      return (structure.structureType === STRUCTURE_SPAWN ||
              structure.structureType === STRUCTURE_EXTENSION ||
              structure.structureType === STRUCTURE_CONTAINER) &&
              structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
    }
  });
  if (target) {
    if (this.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      this.moveTo(target);
    }
  }
};

// TaskManager instance
const taskManager = new TaskManager();
// Main game loop
export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`Current game tick is ${Game.time}`);

  const MAX_CREEPS = 2;
  const creeps = Object.keys(Game.creeps).length;

  if (creeps < MAX_CREEPS) {
    const newName = 'Creep' + Game.time;
    Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE], newName, {
      memory: { role: 'worker', room: Game.spawns['Spawn1'].room.name, working: false }
    });
  }

  if (Memory.tasks.length === 0) {
    const someLocation = Game.spawns['Spawn1'].pos;
    const harvestLocation = someLocation; // Adjust this to be a valid RoomPosition of a Source
    const upgradeLocation = Game.rooms[someLocation.roomName]?.controller?.pos; // Adjust this for controller position

    taskManager.addTask(new Task('harvest', 1, harvestLocation, 'sourceIdHere')); // Replace 'sourceIdHere' with a valid Source ID
    if (upgradeLocation !== undefined) { // Add null check for upgradeLocation
      taskManager.addTask(new Task('upgrade', 2, upgradeLocation, 'controllerIdHere')); // 'controllerIdHere' can be any identifier
    }
  }

  taskManager.prioritizeTasks();

  const tasks = taskManager.getTasks();

  for (let name in Game.creeps) {
    let creep = Game.creeps[name];
    if (creep.store.getUsedCapacity() === 0 && creep.memory.working) {
      creep.memory.working = false;
    } else if (creep.store.getFreeCapacity() === 0 && !creep.memory.working) {
      creep.memory.working = true;
    }

    if (creep.memory.working) {
      let task = taskManager.getTaskForCreep(creep);
      if (task) {
        creep.performTask(task);
      }
    } else {
      creep.moveTo(Game.spawns['Spawn1']);
    }
  }

  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
});
