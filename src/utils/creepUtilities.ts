// Import the Task class from the taskManager module
import { Task } from "../taskManager";

// Extend the Creep prototype with a method to find an active energy source
Creep.prototype.findEnergySource = function (): Source | null {
  const source = this.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
  console.log(`Creep ${this.name} finding energy source: ${source ? source.id : "none found"}`);
  return source;
};

Creep.prototype.performTask = function (task: Task): void {
  switch (task.type) {
    case "harvest":
      this.performHarvestTask(task);
      break;
    case "fill container":
      this.performFillContainerTask(task);
      break;
    case "upgrade":
      this.performUpgradeTask(task);
      break;
  }
};
Creep.prototype.performHarvestTask = function (task: Task): void {
  const source = Game.getObjectById<Source>(task.id);
  if (source) {
    if (this.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
      console.log(`Creep ${this.name} harvesting from source: ${source.id}`);
      if (this.harvest(source) === ERR_NOT_IN_RANGE) {
        this.moveTo(source);
      }
    } else {
      console.log(`Creep ${this.name} is full, delivering energy`);
      this.deliverEnergy();
    }
  } else {
    console.log(`Creep ${this.name}: Source ${task.id} not found for harvesting`);
  }
};

Creep.prototype.performFillContainerTask = function (task: Task): void {
  const container = Game.getObjectById<StructureContainer>(task.id);
  if (container) {
    if (this.store.getUsedCapacity() > 0) {
      console.log(`Creep ${this.name} transferring energy to container: ${container.id}`);
      if (this.transfer(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        this.moveTo(container);
      }
    } else {
      console.log(`Creep ${this.name} is empty, harvesting energy`);
      this.performHarvestTask(task);
    }
  } else {
    console.log(`Creep ${this.name}: Container ${task.id} not found for filling`);
  }
};

Creep.prototype.performUpgradeTask = function (task: Task): void {
  const controller = Game.rooms[task.location.roomName].controller;
  if (controller) {
    console.log(`Creep ${this.name} upgrading controller in room ${task.location.roomName}`);
    if (this.store.getUsedCapacity() > 0) {
      if (this.upgradeController(controller) === ERR_NOT_IN_RANGE) {
        this.moveTo(controller);
      }
    } else {
      console.log(`Creep ${this.name} is empty, harvesting energy`);
      this.performHarvestTask(task);
    }
  } else {
    console.log(`Creep ${this.name}: Controller in room ${task.location.roomName} not found`);
  }
};

// Extend the Creep prototype with a method to deliver energy
Creep.prototype.deliverEnergy = function (): void {
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
  if (target) {
    console.log(`Creep ${this.name} delivering energy to target: ${target.id}`);
    if (this.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      this.moveTo(target);
    }
  } else {
    const controller = Game.rooms[this.pos.roomName].controller;
    if (controller) {
      console.log(`Creep ${this.name} upgrading controller in room ${this.pos.roomName}`);
      if (this.upgradeController(controller) === ERR_NOT_IN_RANGE) {
        this.moveTo(controller);
      }
    } else {
      console.log(`Creep ${this.name}: Controller in room ${this.pos.roomName} not found`);
    }
    console.log(`Creep ${this.name} found no valid target to deliver energy`);
  }
};
