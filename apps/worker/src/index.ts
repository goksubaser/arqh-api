import Mongoose from "mongoose";
import Redis from "ioredis";
import { config } from "./config";
import {
  REDIS_SAVE_STREAM,
  REDIS_SAVE_CONSUMER_GROUP,
  REDIS_SAVE_CONSUMER,
} from "./redis-keys";
import { runSaveTask } from "./tasks/save";

const BLOCK_MS = 5000;

async function connectMongo(): Promise<void> {
  if (!config.DB_URL) {
    throw new Error("DB_URL is not set");
  }
  await Mongoose.connect(config.DB_URL);
  console.log("[worker] Connected to MongoDB");
}

async function ensureConsumerGroup(redis: Redis): Promise<void> {
  try {
    await redis.xgroup("CREATE", REDIS_SAVE_STREAM, REDIS_SAVE_CONSUMER_GROUP, "0", "MKSTREAM");
    console.log("[worker] Created consumer group");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("BUSYGROUP")) {
      console.error("[worker] Failed to create consumer group:", err);
      throw err;
    }
  }
}

type StreamReply = [string, [string, string[]][]][];

async function processSaveMessages(redis: Redis): Promise<void> {
  const replies = (await redis.xreadgroup(
    "GROUP",
    REDIS_SAVE_CONSUMER_GROUP,
    REDIS_SAVE_CONSUMER,
    "BLOCK",
    BLOCK_MS,
    "STREAMS",
    REDIS_SAVE_STREAM,
    ">"
  )) as StreamReply | null;
  if (!replies) return;

  for (const [, messages] of replies) {
    for (const [id, fields] of messages) {
      const task = fields[1]; // fields are [key, value, key, value, ...]
      if (task === "save") {
        try {
          await runSaveTask(redis);
          await redis.xack(REDIS_SAVE_STREAM, REDIS_SAVE_CONSUMER_GROUP, id);
          console.log("[worker] Save task completed:", id);
        } catch (err) {
          console.error("[worker] Save task failed:", id, err);
        }
      }
    }
  }
}

async function run(): Promise<void> {
  if (!config.REDIS_URL || !config.DB_URL) {
    throw new Error("REDIS_URL is not set");
  }
  const redis = new Redis(config.REDIS_URL);
  await redis.ping();
  console.log("[worker] Connected to Redis");

  await connectMongo();
  await ensureConsumerGroup(redis);

  console.log("[worker] Listening for tasks...");
  while (true) {
    try {
      await processSaveMessages(redis);
    } catch (err) {
      console.error("[worker] Loop error:", err);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

run().catch((err) => {
  console.error("[worker] Fatal:", err);
  process.exit(1);
});
