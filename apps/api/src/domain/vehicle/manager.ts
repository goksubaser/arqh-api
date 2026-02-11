import type Redis from "ioredis";
import { injectable } from "tsyringe";
import { VehicleService } from "./service";
import type { Vehicle } from "types";

@injectable()
class VehicleManager {
  constructor(private readonly vehicleService: VehicleService) {}

  find(redis: Redis): Promise<Vehicle[]> {
    return this.vehicleService.find(redis);
  }

  create(redis: Redis, vehicle: Vehicle) {
    return this.vehicleService.create(redis, vehicle);
  }

  update(redis: Redis, id: string, vehicle: Vehicle) {
    return this.vehicleService.update(redis, id, vehicle);
  }

  delete(redis: Redis, id: string) {
    return this.vehicleService.delete(redis, id);
  }
}

export default VehicleManager;
