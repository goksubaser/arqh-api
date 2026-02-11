import type Redis from "ioredis";
import { REDIS_RESULTS_STREAM, REDIS_SOLUTION_KEY } from "types";

const BLOCK_MS = 5000;

export type OptimizationResultCallback = (vehicleId: string) => void;

export function startResultsConsumer(
  redis: Redis,
  onResult: OptimizationResultCallback
): void {
  let lastId = "$";
  const run = async () => {
    while (true) {
      try {
        const replies = await redis.xread("BLOCK", BLOCK_MS, "STREAMS", REDIS_RESULTS_STREAM, lastId);
        if (!replies) continue;
        for (const [, messages] of replies as [string, [string, string[]][]][]) {
          for (const [id, fields] of messages) {
            lastId = id;
            const vehicleIdIdx = fields.indexOf("vehicleId");
            const routeIdx = fields.indexOf("route");
            const vehicleId = vehicleIdIdx >= 0 ? fields[vehicleIdIdx + 1] : null;
            const routeJson = routeIdx >= 0 ? fields[routeIdx + 1] : "[]";
            if (!vehicleId) continue;
            let route: string[];
            try {
              route = JSON.parse(routeJson);
            } catch {
              continue;
            }
            const solutionRaw = await redis.get(REDIS_SOLUTION_KEY);
            const solution = solutionRaw ? JSON.parse(solutionRaw) : { assignments: [] };
            const assignments = solution.assignments ?? [];
            const idx = assignments.findIndex((a: { vehicle_id: string }) => a.vehicle_id === vehicleId);
            if (idx >= 0) {
              assignments[idx] = { ...assignments[idx], route };
              await redis.set(REDIS_SOLUTION_KEY, JSON.stringify({ assignments }));
            }
            onResult(vehicleId);
          }
        }
      } catch (err) {
        console.error("[results-consumer] Error:", err);
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  };
  run();
}
