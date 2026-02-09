import { FastifyServer } from "./interface/server";

export function createServer(fastify: any): FastifyServer {
  const config: any = { logger: process.env.DISABLE_LOGGER !== "true" };
  return fastify(config);
}
