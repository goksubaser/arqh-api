import fs from "fs";
import path from "path";
import { VehicleModel } from "./domain/vehicle/model";
import { OrderModel } from "./domain/order/model";
import { SolutionModel } from "./domain/solution/model";
import { Solution } from "types";
import type { Redis } from "ioredis";

export const REDIS_SOLUTION_KEY = "dispatch:solution";
export const REDIS_VEHICLES_KEY = "dispatch:vehicles";
export const REDIS_ORDERS_KEY = "dispatch:orders";

function getDataPath(filename: string): string {
  return path.join(__dirname, "../../../data", filename);
}

export async function seedMongo(): Promise<void> {
  const vehiclesPath = getDataPath("vehicles.json");
  const ordersPath = getDataPath("orders.json");
  const solutionPath = getDataPath("solution.json");

  const vehicles = JSON.parse(fs.readFileSync(vehiclesPath, "utf-8"));
  const orders = JSON.parse(fs.readFileSync(ordersPath, "utf-8"));
  const solution = JSON.parse(fs.readFileSync(solutionPath, "utf-8"));

  for (const v of vehicles) {
    await VehicleModel.findOneAndUpdate({ id: v.id }, v, { upsert: true });
  }
  for (const o of orders) {
    await OrderModel.findOneAndUpdate({ id: o.id }, o, { upsert: true });
  }
  await SolutionModel.findOneAndUpdate({}, solution, { upsert: true });
}

export async function hydrateRedis(redis: Redis): Promise<void> {
  const latest = await SolutionModel.findOne().sort({ updatedAt: -1 });
  const vehicles = await VehicleModel.find();
  const orders = await OrderModel.find();

  const solution: Solution = latest
    ? { assignments: latest.assignments }
    : { assignments: [] };
  await redis.set(REDIS_SOLUTION_KEY, JSON.stringify(solution));
  await redis.set(REDIS_VEHICLES_KEY, JSON.stringify(vehicles));
  await redis.set(REDIS_ORDERS_KEY, JSON.stringify(orders));
}
