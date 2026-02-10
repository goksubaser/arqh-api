import { FastifyInstance } from "fastify";
import { Server, IncomingMessage, ServerResponse } from "http";
import Redis from "ioredis";
import VehicleManager from "../domain/vehicle/manager";
import SolutionManager from "../domain/solution/manager";

export interface ServerConfig {
  NODE_ENV: string;
  DB_URL: string;
  REDIS_URL: string;
}

export interface FastifyServer
  extends FastifyInstance<Server, IncomingMessage, ServerResponse> {
  config: ServerConfig;
  upAndRunning: boolean;
  redis: Redis;
  vehicleManager: VehicleManager;
  solutionManager: SolutionManager;
}
