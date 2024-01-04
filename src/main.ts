// Import necessary utilities and classes.
import { ErrorMapper } from "utils/ErrorMapper";
import { Task, TaskManager } from "./taskManager";
import "./utils/creepUtilities";

// Create an instance of TaskManager to handle task assignments.
const taskManager = new TaskManager();

// Main game loop, wrapped in ErrorMapper for better debugging.
export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`Current game tick is ${Game.time}`);

  // Maximum number of creeps allowed.
  const MAX_CREEPS = 2;
  // Current number of creeps in the game.
  const creeps = Object.keys(Game.creeps).length;

  // Check if the number of creeps is less than the maximum allowed.
  if (creeps < MAX_CREEPS) {
    // Generate a new name for the creep based on the current game time.
    const newName = "Creep" + Game.time;
    // Spawn a new creep with specified body parts and memory settings.
    Game.spawns["Spawn1"].spawnCreep([WORK, CARRY, MOVE], newName, {
      memory: { role: "worker", room: Game.spawns["Spawn1"].room.name, working: false }
    });
  }

  // Generate tasks for creeps to perform.
  generateTasks();

  // Prioritize the tasks in the task manager.
  taskManager.prioritizeTasks();

  // Iterate through all creeps and assign tasks.
  for (let name in Game.creeps) {
    let creep = Game.creeps[name];
    // Update each creep's working state based on their current capacity.
    updateCreepWorkingState(creep);

    // Assign tasks to creeps based on their working state.
    if (creep.memory.working) {
      let task = taskManager.getTaskForCreep(creep);
      if (task) {
        // Perform the assigned task if available.
        creep.performTask(task);
      }
    } else {
      // Move idle creeps to the spawn point.
      creep.moveTo(Game.spawns["Spawn1"]);
    }
  }

  // Clean up memory of dead creeps.
  cleanupMemory();
});

function generateTasks() {
  const room = Game.spawns["Spawn1"].room;
  // Find active sources in the room.
  const sources = room.find(FIND_SOURCES_ACTIVE);
  const controller = room.controller;

  // Add a harvest task for each active source if not already present.
  sources.forEach(source => {
    if (!taskManager.getTasks().some(task => task.type === "harvest" && task.id === source.id)) {
      taskManager.addTask(new Task("harvest", 1, source.pos, source.id));
    }
  });

  // Add an upgrade task for the controller if not already present.
  if (controller && !taskManager.getTasks().some(task => task.type === "upgrade" && task.id === controller.id)) {
    taskManager.addTask(new Task("upgrade", 2, controller.pos, controller.id));
  }
}

function updateCreepWorkingState(creep: Creep) {
  // Switch the working state of the creep based on its storage capacity.
  if (creep.store.getUsedCapacity() === 0 && creep.memory.working) {
    creep.memory.working = false;
  } else if (creep.store.getFreeCapacity() === 0 && !creep.memory.working) {
    creep.memory.working = true;
  }
}

function cleanupMemory() {
  // Remove memory entries for creeps that no longer exist in the game.
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
}
