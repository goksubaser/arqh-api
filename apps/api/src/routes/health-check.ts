import { FastifyServer } from "../interface/server";

export const healthCheck = (server: FastifyServer) => {
  server.get(
    "/health",
    {
      schema: {
        response: {
          200: {
            type: "object",
            properties: { message: { type: "string" }, redis: { type: "string" } },
          },
        },
      },
    },
    async (_request, reply) => {
      const redisStatus = await server.redis.ping().then(() => "ok").catch(() => "error");
      return reply.code(200).send({ message: "running", redis: redisStatus });
    }
  );

  server.get(
    "/ready",
    {
      schema: {
        response: {
          200: { type: "object", properties: { message: { type: "string" } } },
          503: { type: "object", properties: { message: { type: "string" } } },
        },
      },
    },
    (_request, reply) => {
      if (server.upAndRunning) {
        return reply.code(200).send({ message: "up and running" });
      }
      return reply.code(503).send({ message: "not yet" });
    }
  );
};
