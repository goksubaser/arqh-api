import { FastifyPluginAsync } from "fastify";
import { apiSchemas } from "../schemas";
import { validateRequest, validateResponse } from "../validation/validate";
import { hydrateRedis } from "../hydration";
import { FastifyServer } from "../interface/server";
import { REDIS_SAVE_STREAM } from "../config/redis-keys";

const apiRoutes: FastifyPluginAsync = async (server) => {
  server.post("/hydrate", async (request, reply) => {
    await hydrateRedis((request.server as FastifyServer).redis);
    const result = validateResponse(apiSchemas.postHydrate.response[200], { hydrated: true });
    return reply.code(200).send(result);
  });

  server.post("/optimize", async (request, reply) => {
    const body = validateRequest(apiSchemas.postOptimize.body, request.body, reply);
    if (body === null) return;
    // TODO: implement - Redis Streams
    const result = validateResponse(apiSchemas.postOptimize.response[200], {});
    return reply.code(200).send(result);
  });

  server.post("/save", async (request, reply) => {
    try {
      const redis = (request.server as FastifyServer).redis;
      await redis.xadd(REDIS_SAVE_STREAM, "*", "task", "save", "ts", String(Date.now()));
      const result = validateResponse(apiSchemas.postSave.response[200], { success: true });
      return reply.code(202).send(result);
    } catch (err) {
      request.server.log.error(err);
      return reply.code(500).send({ error: "Failed to queue save" });
    }
  });
};

export default apiRoutes;
