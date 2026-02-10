import { FastifyReply } from "fastify";
import { z } from "zod";

export function validateRequest<T>(schema: z.ZodType<T>, data: unknown, reply: FastifyReply): T | null {
  const result = schema.safeParse(data);
  if (!result.success) {
    reply.code(400).send({ error: "Validation failed", details: result.error.flatten().fieldErrors });
    return null;
  }
  return result.data;
}

export function validateResponse<T>(schema: z.ZodType<T>, data: unknown): T {
  return schema.parse(data);
}
