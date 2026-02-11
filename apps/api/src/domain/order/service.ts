import type Redis from "ioredis";
import { injectable } from "tsyringe";
import { REDIS_ORDERS_KEY, REDIS_SOLUTION_KEY } from "types";
import type { Order } from "types";

export type CreateResult = { ok: true; order: Order } | { ok: false; error: string };
export type UpdateResult = { ok: true; order: Order } | { ok: false; error: string };
export type DeleteResult = { ok: true } | { ok: false; error: string };

function isNotDeleted<T extends { deleted?: boolean }>(x: T): boolean {
  return !x.deleted;
}

@injectable()
export class OrderService {
  async find(redis: Redis): Promise<Order[]> {
    const ordersRaw = await redis.get(REDIS_ORDERS_KEY);
    const orders: Order[] = ordersRaw ? JSON.parse(ordersRaw) : [];
    return orders.filter(isNotDeleted);
  }

  async findById(redis: Redis, id: string): Promise<Order | null> {
    const ordersRaw = await redis.get(REDIS_ORDERS_KEY);
    const orders: Order[] = ordersRaw ? JSON.parse(ordersRaw) : [];
    const found = orders.find((o) => o.id === id && isNotDeleted(o));
    return found ?? null;
  }

  async create(redis: Redis, order: Order): Promise<CreateResult> {
    const ordersRaw = await redis.get(REDIS_ORDERS_KEY);
    const orders: Order[] = ordersRaw ? JSON.parse(ordersRaw) : [];
    if (orders.some((o) => o.id === order.id)) {
      return { ok: false, error: "Order already exists" };
    }
    const created = { ...order, deleted: false };
    orders.push(created);
    await redis.set(REDIS_ORDERS_KEY, JSON.stringify(orders));
    return { ok: true, order: created };
  }

  async update(redis: Redis, id: string, order: Order): Promise<UpdateResult> {
    const ordersRaw = await redis.get(REDIS_ORDERS_KEY);
    const orders: Order[] = ordersRaw ? JSON.parse(ordersRaw) : [];
    const index = orders.findIndex((o) => o.id === id && isNotDeleted(o));
    if (index === -1) {
      return { ok: false, error: "Order not found" };
    }
    orders[index] = { ...order, id, deleted: false };
    await redis.set(REDIS_ORDERS_KEY, JSON.stringify(orders));
    return { ok: true, order: orders[index] };
  }

  async delete(redis: Redis, id: string): Promise<DeleteResult> {
    const ordersRaw = await redis.get(REDIS_ORDERS_KEY);
    const orders: Order[] = ordersRaw ? JSON.parse(ordersRaw) : [];
    const index = orders.findIndex((o) => o.id === id && isNotDeleted(o));
    if (index === -1) {
      return { ok: false, error: "Order not found" };
    }
    orders[index] = { ...orders[index], deleted: true };
    await redis.set(REDIS_ORDERS_KEY, JSON.stringify(orders));
    const solutionRaw = await redis.get(REDIS_SOLUTION_KEY);
    const solution = solutionRaw ? JSON.parse(solutionRaw) : { assignments: [] };
    const assignments = Array.isArray(solution.assignments) ? solution.assignments : [];
    for (let i = 0; i < assignments.length; i++) {
      if (assignments[i].route) {
        assignments[i] = {
          ...assignments[i],
          route: assignments[i].route.filter((oid: string) => oid !== id),
        };
      }
    }
    await redis.set(REDIS_SOLUTION_KEY, JSON.stringify({ assignments }));
    return { ok: true };
  }
}
