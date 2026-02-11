import fastifyEnv from "@fastify/env";
import Mongoose from "mongoose";
import Redis from "ioredis";
import fastifyStatic from "@fastify/static";
import path from "path";
import { glob } from "glob";
import { getOptions } from "./config";
import { FastifyServer } from "./interface/server";
import { Route } from "./interface/route";
import { decorateManagers } from "./ioc";

import { healthCheck } from "./routes/health-check";
import { staticRoutes } from "./routes/static";
import apiRoutes from "./routes/api";
import { seedMongo, hydrateRedis } from "./hydration";
import { startResultsConsumer } from "./results-consumer";

async function connectWithRetry(dbUrl: string): Promise<typeof Mongoose> {
  const maxRetries = 10;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      return await Mongoose.connect(dbUrl);
    } catch (err) {
      retries++;
      console.error(
        `Failed to connect to mongo (attempt ${retries}/${maxRetries}) - retrying in 5 sec`,
        err
      );
      if (retries >= maxRetries) {
        throw new Error("Failed to connect to MongoDB after maximum retries");
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
  throw new Error("Failed to connect to MongoDB");
}

async function getDomainRoutes(): Promise<Array<string>> {
  return glob(path.join(__dirname, "./domain/*/route.*"));
}

export class Application {
  constructor(private readonly server: FastifyServer) {}

  private async registerDecorators() {
    // Decorators (redis, managers, upAndRunning) registered in plugins
  }

  private async registerPlugins() {
    this.server.addHook("onRequest", async (request, reply) => {
      reply.header("Access-Control-Allow-Origin", this.server.config.WEB_URL);
      reply.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      reply.header("Access-Control-Allow-Headers", "Content-Type, Cache-Control");
      if (request.method === "OPTIONS") {
        return reply.code(204).send();
      }
    });
    await this.server.register(fastifyEnv, getOptions()).ready((err) => {
      if (err) {
        this.server.log.error({ message: err });
        process.exit(1);
      }
      this.server.log.info({ msg: "Configuration loaded", config: this.server.config });
    });
    const server = this.server;
    const optimizationClients = new Set<{ write: (data: string) => void }>();
    const broadcastOptimizationResult = (vehicleId: string) => {
      const msg = `data: ${JSON.stringify({ vehicleId })}\n\n`;
      for (const client of optimizationClients) {
        try {
          client.write(msg);
        } catch {
          optimizationClients.delete(client);
        }
      }
    };
    await this.server.register(async () => {
      const redis = new Redis(server.config.REDIS_URL);
      await redis.ping();
      server.decorate("redis", redis);
      server.decorate("optimizationEventClients", optimizationClients);
      server.decorate("broadcastOptimizationResult", broadcastOptimizationResult);
      await decorateManagers(server);
      server.decorate("upAndRunning", true);
      const resultsConsumerRedis = new Redis(server.config.REDIS_URL);
      await resultsConsumerRedis.ping();
      server.decorate("resultsConsumerRedis", resultsConsumerRedis);
      startResultsConsumer(resultsConsumerRedis, broadcastOptimizationResult);
    });
    await this.server.register(fastifyStatic, {
      root: path.join(__dirname, "../public"),
      serve: false,
    });
  }

  private async registerRoutes() {
    const domainPaths = await getDomainRoutes();
    const domainRoutes: Array<Route> = [];
    for (let i = 0; i < domainPaths.length; i++) {
      domainRoutes.push((await import(domainPaths[i])).default);
    }
    healthCheck(this.server);
    staticRoutes(this.server);
    await this.server.register(apiRoutes, { prefix: "/api" });
    await this.server.register(
      async (instance) => {
        for (const route of domainRoutes) {
          route(instance as FastifyServer);
        }
      },
      { prefix: "/api" }
    );
  }

  private async connect(): Promise<typeof Mongoose> {
    const dbUrl = this.server.config.DB_URL;
    return connectWithRetry(dbUrl);
  }

  public async disconnect() {
    this.server.redis?.disconnect();
    (this.server as any).resultsConsumerRedis?.disconnect();
    await Mongoose.disconnect();
  }

  public async init() {
    await this.registerRoutes();
    this.server.log.info("registered routes");
    await this.registerPlugins();
    this.server.log.info("registered plugins");
    await this.registerDecorators();
    await this.server.ready();
    await this.connect();
    this.server.log.info("connected to db");
    await seedMongo();
    this.server.log.info("seeded mongo");
    await hydrateRedis(this.server.redis);
    this.server.log.info("hydrated redis");
  }

  public async run() {
    try {
      await this.server.listen({ port: 5052, host: "0.0.0.0" });
    } catch (err) {
      await this.disconnect();
      console.error(err);
      process.exit(1);
    }
  }
}
