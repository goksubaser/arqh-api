import { FastifyServer } from "../../interface/server";
import { orderSchema, orderIdParamSchema, orderListSchema, emptyResponseSchema } from "../../schemas";
import { validateRequest, validateResponse } from "../../validation/validate";

export default function routes(server: FastifyServer) {
  server.get("/orders", async (_request, reply) => {
    // TODO: implement
    const result = validateResponse(orderListSchema, []);
    return reply.code(200).send(result);
  });

  server.post("/orders", async (request, reply) => {
    const body = validateRequest(orderSchema, request.body, reply);
    if (body === null) return;
    // TODO: implement
    const result = validateResponse(orderSchema, body);
    return reply.code(201).send(result);
  });

  server.put("/orders/:id", async (request, reply) => {
    const params = validateRequest(orderIdParamSchema, request.params, reply);
    if (params === null) return;
    const body = validateRequest(orderSchema, request.body, reply);
    if (body === null) return;
    // TODO: implement
    const result = validateResponse(orderSchema, body);
    return reply.code(200).send(result);
  });

  server.delete("/orders/:id", async (request, reply) => {
    const params = validateRequest(orderIdParamSchema, request.params, reply);
    if (params === null) return;
    // TODO: implement
    const result = validateResponse(emptyResponseSchema, {});
    return reply.code(200).send(result);
  });
}
