import { FastifyServer } from "../../interface/server";
import {
  orderSchema,
  orderIdParamSchema,
  orderListSchema,
  emptyResponseSchema,
} from "../../schemas";
import { validateRequest, validateResponse } from "../../validation/validate";

export default function routes(server: FastifyServer) {
  server.get("/orders", async (_request, reply) => {
    try {
      const data = await server.orderManager.find(server.redis);
      const result = validateResponse(orderListSchema, data);
      return reply.code(200).send(result);
    } catch (err) {
      server.log.error(err);
      return reply.code(500).send({ error: "Failed to read orders" });
    }
  });

  server.post("/orders", async (request, reply) => {
    const body = validateRequest(orderSchema, request.body, reply);
    if (body === null) return;
    const result = await server.orderManager.create(server.redis, body);
    if (!result.ok) {
      return reply.code(409).send({ error: result.error });
    }
    return reply.code(201).send(validateResponse(orderSchema, result.order));
  });

  server.put("/orders/:id", async (request, reply) => {
    const params = validateRequest(orderIdParamSchema, request.params, reply);
    if (params === null) return;
    const body = validateRequest(orderSchema, request.body, reply);
    if (body === null) return;
    const result = await server.orderManager.update(server.redis, params.id, body);
    if (!result.ok) {
      return reply.code(404).send({ error: result.error });
    }
    return reply.code(200).send(validateResponse(orderSchema, result.order));
  });

  server.delete("/orders/:id", async (request, reply) => {
    const params = validateRequest(orderIdParamSchema, request.params, reply);
    if (params === null) return;
    const result = await server.orderManager.delete(server.redis, params.id);
    if (!result.ok) {
      return reply.code(404).send({ error: result.error });
    }
    return reply.code(200).send(validateResponse(emptyResponseSchema, {}));
  });
}
