import { FastifyServer } from "../interface/server";

export const healthCheck = (server: FastifyServer) => {
  server.get(
    "/health",
    {
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              message: {
                type: "string",
              },
            },
          },
        },
      },
    },
    (request, reply) => {
      reply.code(200).send({ message: "running" });
    }
  );

  server.get(
    "/ready",
    {
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              message: {
                type: "string",
              },
            },
          },
          503: {
            type: "object",
            properties: {
              message: {
                type: "string",
              },
            },
          },
        },
      },
    },
    (request, reply) => {
      if (server.upAndRunning) {
        return reply.code(200).send({ message: "up and running" });
      }
      reply.code(503).send({ message: "not yet" });
    }
  );
};
