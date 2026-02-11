import { injectable } from "tsyringe";
import { Vehicle } from "types";
import { VehicleService } from "./service";
import { Redis } from "ioredis";

@injectable()
class VehicleManager {
  constructor(private readonly vehicleService: VehicleService) {}

  getState(redis: Redis): Promise<Vehicle[]> {
    return this.vehicleService.getState(redis);
  }
}

export default VehicleManager;
