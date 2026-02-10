import type Redis from "ioredis";
import { injectable } from "tsyringe";
import {
  REDIS_SOLUTION_KEY,
  REDIS_VEHICLES_KEY,
  REDIS_ORDERS_KEY,
} from "../../hydration";
import type { Assignment } from "types";

export interface AssignParams {
  orderId: string;
  vehicleId: string;
}

export type AssignResult =
  | { ok: true }
  | { ok: false; statusCode: 400; error: string; orderId?: string; vehicleId?: string }
  | { ok: false; statusCode: 500; error: string };

@injectable()
export class SolutionService {
  async assignOrder(redis: Redis, params: AssignParams): Promise<AssignResult> {
    const { orderId, vehicleId } = params;
    try {
      const [solutionRaw, vehiclesRaw, ordersRaw] = await Promise.all([
        redis.get(REDIS_SOLUTION_KEY),
        redis.get(REDIS_VEHICLES_KEY),
        redis.get(REDIS_ORDERS_KEY),
      ]);
      const vehicles = vehiclesRaw ? JSON.parse(vehiclesRaw) : [];
      const orders = ordersRaw ? JSON.parse(ordersRaw) : [];
      const vehicleIds = new Set((vehicles as { id: string }[]).map((v) => v.id));
      const orderIds = new Set((orders as { id: string }[]).map((o) => o.id));

      if (!orderIds.has(orderId)) {
        return { ok: false, statusCode: 400, error: "Invalid orderId", orderId };
      }
      if (!vehicleIds.has(vehicleId)) {
        const unassigned = this.removeOrderFromAllAssignments(
          solutionRaw ? JSON.parse(solutionRaw) : { assignments: [] },
          orderId
        );
        await redis.set(REDIS_SOLUTION_KEY, JSON.stringify(unassigned));
        return { ok: true };
      }

      const solution = solutionRaw ? JSON.parse(solutionRaw) : { assignments: [] };
      const assignments = Array.isArray(solution.assignments)
        ? (solution.assignments as Assignment[])
        : [];

      this.removeOrderFromOtherRoutes(assignments, orderId, vehicleId);
      const index = assignments.findIndex((a) => a.vehicle_id === vehicleId);
      if (index >= 0) {
        const route = assignments[index].route ?? [];
        if (!route.includes(orderId)) {
          assignments[index] = { ...assignments[index], route: [...route, orderId] };
        }
      } else {
        assignments.push({ vehicle_id: vehicleId, route: [orderId] });
      }
      await redis.set(REDIS_SOLUTION_KEY, JSON.stringify({ assignments }));
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        statusCode: 500,
        error: err instanceof Error ? err.message : "Failed to assign order",
      };
    }
  }

  private removeOrderFromOtherRoutes(
    assignments: Assignment[],
    orderId: string,
    targetVehicleId: string
  ): void {
    for (let i = 0; i < assignments.length; i++) {
      if (assignments[i].vehicle_id !== targetVehicleId && assignments[i].route) {
        assignments[i] = {
          ...assignments[i],
          route: assignments[i].route.filter((id) => id !== orderId),
        };
      }
    }
  }

  private removeOrderFromAllAssignments(solution: { assignments?: Assignment[] }, orderId: string): { assignments: Assignment[] } {
    const assignments = Array.isArray(solution.assignments) ? solution.assignments : [];
    for (let i = 0; i < assignments.length; i++) {
      if (assignments[i].route) {
        assignments[i] = {
          ...assignments[i],
          route: assignments[i].route.filter((id) => id !== orderId),
        };
      }
    }
    return { assignments };
  }
}
