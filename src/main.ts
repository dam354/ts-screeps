// Import necessary utilities and classes.
import { ErrorMapper } from "utils/ErrorMapper";
import { Task, TaskManager } from "./taskManager";
import "./utils/creepUtilities";

// Create an instance of TaskManager to handle task assignments.
const taskManager = new TaskManager();

// Main game loop, wrapped in ErrorMapper for better debugging.
export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`Current game tick is ${Game.time}`);

  const MAX_CREEPS = 1;
  const creeps = Object.keys(Game.creeps).length;

  console.log(`Current number of creeps: ${creeps}, Max allowed: ${MAX_CREEPS}`);

  if (creeps < MAX_CREEPS) {
    const newName = "Creep" + Game.time;
    console.log(`Spawning new creep: ${newName}`);
    Game.spawns["Spawn1"].spawnCreep([WORK, CARRY, MOVE], newName, {
      memory: { role: "worker", room: Game.spawns["Spawn1"].room.name, working: false }
    });
  } else {
    console.log("Maximum number of creeps reached, not spawning more.");
  }

  console.log("Generating tasks for creeps.");
  generateTasks();

  console.log("Prioritizing tasks in the task manager.");
  taskManager.prioritizeTasks();

  for (let name in Game.creeps) {
    let creep = Game.creeps[name];
    console.log(`Updating working state for Creep ${name}.`);
    updateCreepWorkingState(creep);
    let task = taskManager.getTaskForCreep(creep);
    if (task) {
      console.log(`Creep ${name} assigned task: ${task.type}, id: ${task.id}`);
      creep.performTask(task);

      // Update working state based on the task being performed
      updateCreepWorkingState(creep);
    } else {
      console.log(`No suitable task found for Creep ${name}, moving to spawn.`);
      creep.moveTo(Game.spawns["Spawn1"]);
    }
  }

  console.log("Cleaning up memory of dead creeps.");
  cleanupMemory();
});

function generateTasks() {
  const room = Game.spawns["Spawn1"].room;
  const sources = room.find(FIND_SOURCES_ACTIVE);
  const controller = room.controller;
  const containers = room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_CONTAINER });

  sources.forEach(source => {
    if (!taskManager.getTasks().some(task => task.type === "harvest" && task.id === source.id)) {
      taskManager.addTask(new Task("harvest", 1, source.pos, source.id));
    }
  });

  containers.forEach(container => {
    if (!taskManager.getTasks().some(task => task.type === "fill container" && task.id === container.id)) {
      taskManager.addTask(new Task("fill container", 2, container.pos, container.id));
    }
  });

  if (controller && !taskManager.getTasks().some(task => task.type === "upgrade" && task.id === controller.id)) {
    taskManager.addTask(new Task("upgrade", 3, controller.pos, controller.id));
  }
}

function updateCreepWorkingState(creep: Creep) {
  if (creep.store.getUsedCapacity() === 0 && !creep.memory.working) {
    return;
  }

  if (creep.store.getFreeCapacity() === 0 && creep.memory.working) {
    return;
  }

  const currentTask = taskManager.getTaskForCreep(creep);
  if (currentTask) {
    if (
      (currentTask.type === "harvest" || currentTask.type === "fill container") &&
      creep.store.getFreeCapacity() > 0
    ) {
      creep.memory.working = true;
    } else if (
      currentTask.type !== "harvest" &&
      currentTask.type !== "fill container" &&
      creep.store.getUsedCapacity() > 0
    ) {
      creep.memory.working = false;
    }
  }
}

function cleanupMemory() {
  // Remove memory entries for creeps that no longer exist in the game.
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      console.log(`Creep ${name} no longer exists, removing from memory.`);
      delete Memory.creeps[name];
    }
  }
}
