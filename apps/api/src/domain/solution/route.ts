import { FastifyServer } from "../../interface/server";
import { validateRequest, validateResponse } from "../../validation/validate";
import { apiSchemas } from "../../schemas";
import { REDIS_EVENTS_STREAM, EVENT_OPTIMIZE_ROUTE } from "types";

export default function routes(server: FastifyServer) {
  server.get("/state", async (request, reply) => {
    try {
      const data = await server.solutionManager.getState(server.redis);
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
    const result = await server.solutionManager.assignOrder(server.redis, body);
    if (result.ok) {
      const response = validateResponse(apiSchemas.postAssign.response[200], {});
      return reply.code(200).send(response);
    }
    const { statusCode, error } = result;
    const payload =
      result.statusCode === 400 && ("orderId" in result || "vehicleId" in result)
        ? { error, ...("orderId" in result && { orderId: result.orderId }), ...("vehicleId" in result && { vehicleId: result.vehicleId }) }
        : { error };
    return reply.code(statusCode).send(payload);
  });

  server.get("/optimization-events", async (_request, reply) => {
    reply.hijack();
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": server.config.WEB_URL,
    });
    const client = { write: (data: string) => reply.raw.write(data) };
    server.optimizationEventClients.add(client);
    reply.raw.on("close", () => server.optimizationEventClients.delete(client));
  });

  server.post("/optimize", async (request, reply) => {
    const body = validateRequest(apiSchemas.postOptimize.body, request.body, reply);
    if (body === null) return;
    try {
      const redis = server.redis;
      await redis.xadd(REDIS_EVENTS_STREAM, "*", "event", EVENT_OPTIMIZE_ROUTE, "vehicleId", body.vehicleId, "ts", String(Date.now()));
      const result = validateResponse(apiSchemas.postOptimize.response[200], { success: true });
      return reply.code(202).send(result);
    } catch (err) {
      request.server.log.error(err);
      return reply.code(500).send({ error: "Failed to queue optimize" });
    }
  });

  server.post("/drop-vehicle", async (request, reply) => {
    const body = validateRequest(apiSchemas.postDropVehicle.body, request.body, reply);
    if (body === null) return;
    const result = await server.solutionManager.clearVehicleRoute(server.redis, body.vehicleId);
    if (result.ok) {
      const response = validateResponse(apiSchemas.postDropVehicle.response[200], {});
      return reply.code(200).send(response);
    }
    const { statusCode, error } = result;
    const payload =
      result.statusCode === 400 && "vehicleId" in result
        ? { error, vehicleId: result.vehicleId }
        : { error };
    return reply.code(statusCode).send(payload);
  });
}
