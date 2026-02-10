import { FastifyServer } from "../../interface/server";
import { vehicleSchema, vehicleIdParamSchema, vehicleListSchema, emptyResponseSchema } from "../../schemas";
import { validateRequest, validateResponse } from "../../validation/validate";

export default function routes(server: FastifyServer) {
  server.get("/vehicles", async (_request, reply) => {
    // TODO: implement
    const result = validateResponse(vehicleListSchema, []);
    return reply.code(200).send(result);
  });

  server.post("/vehicles", async (request, reply) => {
    const body = validateRequest(vehicleSchema, request.body, reply);
    if (body === null) return;
    // TODO: implement
    const result = validateResponse(vehicleSchema, body);
    return reply.code(201).send(result);
  });

  server.put("/vehicles/:id", async (request, reply) => {
    const params = validateRequest(vehicleIdParamSchema, request.params, reply);
    if (params === null) return;
    const body = validateRequest(vehicleSchema, request.body, reply);
    if (body === null) return;
    // TODO: implement
    const result = validateResponse(vehicleSchema, body);
    return reply.code(200).send(result);
  });

  server.delete("/vehicles/:id", async (request, reply) => {
    const params = validateRequest(vehicleIdParamSchema, request.params, reply);
    if (params === null) return;
    // TODO: implement
    const result = validateResponse(emptyResponseSchema, {});
    return reply.code(200).send(result);
  });
}
