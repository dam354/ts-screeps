// global.d.ts
import { Task } from "./taskManager";

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

export {};
