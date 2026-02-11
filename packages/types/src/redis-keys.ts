/** Redis key names for dispatch state. Shared by api and worker. */
export const REDIS_SOLUTION_KEY = "dispatch:solution";
export const REDIS_VEHICLES_KEY = "dispatch:vehicles";
export const REDIS_ORDERS_KEY = "dispatch:orders";
export const REDIS_SAVE_STREAM = "dispatch:save-requests";
export const REDIS_SAVE_CONSUMER_GROUP = "dispatch-workers";
export const REDIS_SAVE_CONSUMER = "worker-1";

/** Optimize flow: backend publishes to events, worker reads & writes to results */
export const REDIS_EVENTS_STREAM = "events:stream";
export const REDIS_RESULTS_STREAM = "results:stream";
export const REDIS_OPTIMIZE_EVENTS_CONSUMER_GROUP = "events-workers";
export const REDIS_OPTIMIZE_RESULTS_CONSUMER_GROUP = "results-backend";
export const EVENT_OPTIMIZE_ROUTE = "events:optimize_route";
