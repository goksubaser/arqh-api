import { FastifyPluginAsync } from "fastify";
import { apiSchemas } from "../schemas";
import { validateRequest, validateResponse } from "../validation/validate";
import { hydrateRedis, REDIS_SOLUTION_KEY } from "../hydration";
import { FastifyServer } from "../interface/server";

const apiRoutes: FastifyPluginAsync = async (server) => {
  server.post("/hydrate", async (request, reply) => {
    await hydrateRedis((request.server as FastifyServer).redis);
    const result = validateResponse(apiSchemas.postHydrate.response[200], { hydrated: true });
    return reply.code(200).send(result);
  });
  server.get("/state", async (request, reply) => {
    try {
      const redis = (request.server as FastifyServer).redis;
      const raw = await redis.get(REDIS_SOLUTION_KEY);
      const data = raw ? JSON.parse(raw) : { assignments: [] };
      const result = validateResponse(apiSchemas.getState.response[200], data);
      return reply.code(200).send(result);
    } catch (err) {
      request.server.log.error(err);
      return reply.code(500).send({ error: "Failed to read state" });
    }
  });

  server.post("/assign", async (request, reply) => {
    const body = validateRequest(apiSchemas.postAssign.body, request.body, reply);
    if (body === null) return;
    // TODO: implement - update Redis
    const result = validateResponse(apiSchemas.postAssign.response[200], {});
    return reply.code(200).send(result);
  });

  server.post("/optimize", async (request, reply) => {
    const body = validateRequest(apiSchemas.postOptimize.body, request.body, reply);
    if (body === null) return;
    // TODO: implement - Redis Streams
    const result = validateResponse(apiSchemas.postOptimize.response[200], {});
    return reply.code(200).send(result);
  });

  server.post("/save", async (_request, reply) => {
    // TODO: implement - dump Redis to MongoDB
    const result = validateResponse(apiSchemas.postSave.response[200], { success: false });
    return reply.code(200).send(result);
  });
};

export default apiRoutes;
