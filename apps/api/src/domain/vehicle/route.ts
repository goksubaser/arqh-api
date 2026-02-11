import { FastifyServer } from "../../interface/server";
import {
  vehicleSchema,
  vehicleIdParamSchema,
  vehicleListSchema,
  emptyResponseSchema,
} from "../../schemas";
import { validateRequest, validateResponse } from "../../validation/validate";

export default function routes(server: FastifyServer) {
  server.get("/vehicles", async (_request, reply) => {
    try {
      const data = await server.vehicleManager.find(server.redis);
      const result = validateResponse(vehicleListSchema, data);
      return reply.code(200).send(result);
    } catch (err) {
      server.log.error(err);
      return reply.code(500).send({ error: "Failed to read vehicles" });
    }
  });

  server.post("/vehicles", async (request, reply) => {
    const body = validateRequest(vehicleSchema, request.body, reply);
    if (body === null) return;
    const result = await server.vehicleManager.create(server.redis, body);
    if (!result.ok) {
      return reply.code(409).send({ error: result.error });
    }
    return reply.code(201).send(validateResponse(vehicleSchema, result.vehicle));
  });

  server.put("/vehicles/:id", async (request, reply) => {
    const params = validateRequest(vehicleIdParamSchema, request.params, reply);
    if (params === null) return;
    const body = validateRequest(vehicleSchema, request.body, reply);
    if (body === null) return;
    const result = await server.vehicleManager.update(server.redis, params.id, body);
    if (!result.ok) {
      return reply.code(404).send({ error: result.error });
    }
    return reply.code(200).send(validateResponse(vehicleSchema, result.vehicle));
  });

  server.delete("/vehicles/:id", async (request, reply) => {
    const params = validateRequest(vehicleIdParamSchema, request.params, reply);
    if (params === null) return;
    
    await server.solutionManager.removeVehicleFromAssignments(server.redis, params.id);

    const result = await server.vehicleManager.delete(server.redis, params.id);
    if (!result.ok) {
      return reply.code(404).send({ error: result.error });
    }
    return reply.code(200).send(validateResponse(emptyResponseSchema, {}));
  });
}
