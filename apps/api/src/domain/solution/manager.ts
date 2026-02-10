import type Redis from "ioredis";
import { injectable } from "tsyringe";
import { SolutionService, type AssignParams, type AssignResult } from "./service";

@injectable()
class SolutionManager {
  constructor(private readonly solutionService: SolutionService) {}

  assignOrder(redis: Redis, params: AssignParams): Promise<AssignResult> {
    return this.solutionService.assignOrder(redis, params);
  }
}

export default SolutionManager;
