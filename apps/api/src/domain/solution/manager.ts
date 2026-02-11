import type Redis from "ioredis";
import { injectable } from "tsyringe";
import { SolutionService, type AssignParams, type AssignResult, type DropVehicleResult } from "./service";
import { Solution } from "types";

@injectable()
class SolutionManager {
  constructor(private readonly solutionService: SolutionService) {}

  assignOrder(redis: Redis, params: AssignParams): Promise<AssignResult> {
    return this.solutionService.assignOrder(redis, params);
  }

  getState(redis: Redis): Promise<Solution> {
    return this.solutionService.getState(redis);
  }

  clearVehicleRoute(redis: Redis, vehicleId: string): Promise<DropVehicleResult> {
    return this.solutionService.clearVehicleRoute(redis, vehicleId);
  }

  removeVehicleFromAssignments(redis: Redis, vehicleId: string) {
    return this.solutionService.removeVehicleFromAssignments(redis, vehicleId);
  }
}

export default SolutionManager;
