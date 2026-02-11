import { Redis } from "ioredis";
import { injectable } from "tsyringe";
import { REDIS_VEHICLES_KEY } from "../../config/redis-keys";
import { Vehicle } from "types";

@injectable()
export class VehicleService {
  async getState(redis: Redis): Promise<Vehicle[]> {
    const vehiclesRaw = await redis.get(REDIS_VEHICLES_KEY);
    return vehiclesRaw ? JSON.parse(vehiclesRaw) : [];
  }
}
