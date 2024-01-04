// Import the Task class from the taskManager module
import { Task } from "../taskManager";

// Extend the Creep prototype with a method to find an active energy source
Creep.prototype.findEnergySource = function (): Source | null {
  // Use the built-in findClosestByPath method to find the nearest active energy source
  return this.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
};

// Extend the Creep prototype with a method to perform a given task
Creep.prototype.performTask = function (task: Task): void {
  // Use a switch statement to handle different types of tasks
  switch (task.type) {
    case "harvest":
      // If the task is to harvest, call the performHarvestTask method
      this.performHarvestTask(task);
      break;
    case "upgrade":
      // If the task is to upgrade, call the performUpgradeTask method
      this.performUpgradeTask(task);
      break;
    // Additional cases for other task types can be added here
  }
};

// Extend the Creep prototype with a method to perform a harvest task
Creep.prototype.performHarvestTask = function (task: Task): void {
  // If the creep has capacity to store more energy
  if (this.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    // Get the source object from the task id
    const source = Game.getObjectById<Source>(task.id);
    // If the source exists and the creep is not in range to harvest, move to the source
    if (source && this.harvest(source) === ERR_NOT_IN_RANGE) {
      this.moveTo(source);
    }
  } else {
    // If the creep's energy storage is full, deliver the energy
    this.deliverEnergy();
  }
};

// Extend the Creep prototype with a method to perform an upgrade task
Creep.prototype.performUpgradeTask = function (task: Task): void {
  // Get the controller object from the task location
  const controller = Game.rooms[task.location.roomName].controller;
  // If the controller exists and the creep is not in range to upgrade, move to the controller
  if (controller && this.upgradeController(controller) === ERR_NOT_IN_RANGE) {
    this.moveTo(controller);
  }
};

// Extend the Creep prototype with a method to deliver energy
Creep.prototype.deliverEnergy = function (): void {
  // Find the closest structure that can store energy and has free capacity
  const target = this.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: structure => {
      return (
        (structure.structureType === STRUCTURE_SPAWN ||
          structure.structureType === STRUCTURE_EXTENSION ||
          structure.structureType === STRUCTURE_CONTAINER) &&
        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
      );
    }
  });
  // If such a structure exists and the creep is not in range to transfer energy, move to the structure
  if (target) {
    if (this.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      this.moveTo(target);
    }
  }
};
