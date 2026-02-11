import { FastifyServer } from "../../interface/server";
import { validateRequest, validateResponse } from "../../validation/validate";
import { apiSchemas } from "../../schemas";

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
}
