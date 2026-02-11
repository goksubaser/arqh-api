import type Redis from "ioredis";
import { injectable } from "tsyringe";
import { REDIS_VEHICLES_KEY, REDIS_SOLUTION_KEY } from "types";
import type { Vehicle } from "types";

export type CreateResult = { ok: true; vehicle: Vehicle } | { ok: false; error: string };
export type UpdateResult = { ok: true; vehicle: Vehicle } | { ok: false; error: string };
export type DeleteResult = { ok: true } | { ok: false; error: string };

function isNotDeleted<T extends { deleted?: boolean }>(x: T): boolean {
  return !x.deleted;
}

@injectable()
export class VehicleService {
  async find(redis: Redis): Promise<Vehicle[]> {
    const vehiclesRaw = await redis.get(REDIS_VEHICLES_KEY);
    const vehicles: Vehicle[] = vehiclesRaw ? JSON.parse(vehiclesRaw) : [];
    return vehicles.filter(isNotDeleted);
  }

  async findById(redis: Redis, id: string): Promise<Vehicle | null> {
    const vehiclesRaw = await redis.get(REDIS_VEHICLES_KEY);
    const vehicles: Vehicle[] = vehiclesRaw ? JSON.parse(vehiclesRaw) : [];
    const found = vehicles.find((v) => v.id === id && isNotDeleted(v));
    return found ?? null;
  }

  async create(redis: Redis, vehicle: Vehicle): Promise<CreateResult> {
    const vehiclesRaw = await redis.get(REDIS_VEHICLES_KEY);
    const vehicles: Vehicle[] = vehiclesRaw ? JSON.parse(vehiclesRaw) : [];
    if (vehicles.some((v) => v.id === vehicle.id)) {
      return { ok: false, error: "Vehicle already exists" };
    }
    const created = { ...vehicle, deleted: false };
    vehicles.push(created);
    await redis.set(REDIS_VEHICLES_KEY, JSON.stringify(vehicles));
    return { ok: true, vehicle: created };
  }

  async update(redis: Redis, id: string, vehicle: Vehicle): Promise<UpdateResult> {
    const vehiclesRaw = await redis.get(REDIS_VEHICLES_KEY);
    const vehicles: Vehicle[] = vehiclesRaw ? JSON.parse(vehiclesRaw) : [];
    const index = vehicles.findIndex((v) => v.id === id && isNotDeleted(v));
    if (index === -1) {
      return { ok: false, error: "Vehicle not found" };
    }
    vehicles[index] = { ...vehicle, id, deleted: false };
    await redis.set(REDIS_VEHICLES_KEY, JSON.stringify(vehicles));
    return { ok: true, vehicle: vehicles[index] };
  }

  async delete(redis: Redis, id: string): Promise<DeleteResult> {
    const vehiclesRaw = await redis.get(REDIS_VEHICLES_KEY);
    const vehicles: Vehicle[] = vehiclesRaw ? JSON.parse(vehiclesRaw) : [];
    const index = vehicles.findIndex((v) => v.id === id && isNotDeleted(v));
    if (index === -1) {
      return { ok: false, error: "Vehicle not found" };
    }
    vehicles[index] = { ...vehicles[index], deleted: true };
    await redis.set(REDIS_VEHICLES_KEY, JSON.stringify(vehicles));
    const solutionRaw = await redis.get(REDIS_SOLUTION_KEY);
    const solution = solutionRaw ? JSON.parse(solutionRaw) : { assignments: [] };
    const assignments = Array.isArray(solution.assignments)
      ? solution.assignments.filter((a: { vehicle_id: string }) => a.vehicle_id !== id)
      : [];
    await redis.set(REDIS_SOLUTION_KEY, JSON.stringify({ assignments }));
    return { ok: true };
  }
}
