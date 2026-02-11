import type Redis from "ioredis";
import {
  REDIS_SOLUTION_KEY,
  REDIS_RESULTS_STREAM,
  REDIS_EVENTS_STREAM,
  REDIS_OPTIMIZE_EVENTS_CONSUMER_GROUP,
  EVENT_OPTIMIZE_ROUTE,
} from "types";

const CONSUMER = "worker-1";

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export async function runOptimizeTask(redis: Redis, vehicleId: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 1000));
  const solutionRaw = await redis.get(REDIS_SOLUTION_KEY);
  const solution = solutionRaw ? JSON.parse(solutionRaw) : { assignments: [] };
  const assignments = solution.assignments ?? [];
  const idx = assignments.findIndex((a: { vehicle_id: string }) => a.vehicle_id === vehicleId);
  if (idx < 0) return;
  const route = assignments[idx].route ?? [];
  const shuffled = route.length >= 2 ? shuffle(route) : route;
  await redis.xadd(
    REDIS_RESULTS_STREAM,
    "*",
    "vehicleId",
    vehicleId,
    "route",
    JSON.stringify(shuffled),
    "ts",
    String(Date.now())
  );
}

export async function ensureOptimizeConsumerGroup(redis: Redis): Promise<void> {
  try {
    await redis.xgroup("CREATE", REDIS_EVENTS_STREAM, REDIS_OPTIMIZE_EVENTS_CONSUMER_GROUP, "0", "MKSTREAM");
    console.log("[worker] Created optimize events consumer group");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("BUSYGROUP")) {
      console.error("[worker] Failed to create optimize consumer group:", err);
      throw err;
    }
  }
}

type StreamReply = [string, [string, string[]][]][];

export async function processOptimizeEvents(redis: Redis): Promise<void> {
  const replies = (await redis.xreadgroup(
    "GROUP",
    REDIS_OPTIMIZE_EVENTS_CONSUMER_GROUP,
    CONSUMER,
    "BLOCK",
    5000,
    "STREAMS",
    REDIS_EVENTS_STREAM,
    ">"
  )) as StreamReply | null;
  if (!replies) return;

  for (const [, messages] of replies) {
    for (const [id, fields] of messages) {
      const event = fields[1];
      const vehicleIdIdx = fields.indexOf("vehicleId");
      const vehicleId = vehicleIdIdx >= 0 ? fields[vehicleIdIdx + 1] : null;
      if (event === EVENT_OPTIMIZE_ROUTE && vehicleId) {
        try {
          await runOptimizeTask(redis, vehicleId);
          await redis.xack(REDIS_EVENTS_STREAM, REDIS_OPTIMIZE_EVENTS_CONSUMER_GROUP, id);
          console.log("[worker] Optimize task completed:", vehicleId);
        } catch (err) {
          console.error("[worker] Optimize task failed:", vehicleId, err);
        }
      }
    }
  }
}
