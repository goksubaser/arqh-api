import { FastifyPluginAsync } from "fastify";
import { apiSchemas } from "../schemas";
import { validateRequest, validateResponse } from "../validation/validate";

const apiRoutes: FastifyPluginAsync = async (server) => {
  server.get("/state", async (_request, reply) => {
    // TODO: implement - read from Redis
    const result = validateResponse(apiSchemas.getState.response[200], { assignments: [] });
    return reply.code(200).send(result);
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
