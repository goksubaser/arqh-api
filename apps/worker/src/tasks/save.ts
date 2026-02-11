import type Redis from "ioredis";
import {
  REDIS_SOLUTION_KEY,
  REDIS_VEHICLES_KEY,
  REDIS_ORDERS_KEY,
} from "types";
import { VehicleModel, OrderModel, SolutionModel } from "db";
import type { Solution, Vehicle, Order } from "types";

export async function runSaveTask(redis: Redis): Promise<void> {
  const [solutionRaw, vehiclesRaw, ordersRaw] = await Promise.all([
    redis.get(REDIS_SOLUTION_KEY),
    redis.get(REDIS_VEHICLES_KEY),
    redis.get(REDIS_ORDERS_KEY),
  ]);

  const solution: Solution = solutionRaw ? JSON.parse(solutionRaw) : { assignments: [] };
  const vehicles: Vehicle[] = vehiclesRaw ? JSON.parse(vehiclesRaw) : [];
  const orders: Order[] = ordersRaw ? JSON.parse(ordersRaw) : [];

  for (const v of vehicles) {
    await VehicleModel.findOneAndUpdate({ id: v.id }, v, { upsert: true });
  }
  for (const o of orders) {
    await OrderModel.findOneAndUpdate({ id: o.id }, o, { upsert: true });
  }
  await SolutionModel.create(solution);
}
