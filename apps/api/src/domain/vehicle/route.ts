
import { FastifyServer } from "../../interface/server";
import { Vehicle } from "types";

export default function routes(server: FastifyServer) {
  server.get<{
    Querystring: { vehicleId?: string };
  }>(
    "/vehicles",
    async (request, reply) => {
      try {
        const { vehicleId } = request.query;
        
        const filter: any = {};
        if (vehicleId) {
          const vehicleIds = vehicleId.split(",").map((id) => id.trim()).filter(Boolean);
          if (vehicleIds.length > 0) {
            filter.vehicle = { $in: vehicleIds };
          }
        }

        const vehicles = await server.vehicleManager.find(filter);
        return reply.code(200).send(vehicles);
      } catch (error) {
        server.log.error({ action: "error_while_fetching_vehicles", error });
        return reply.code(500).send({});
      }
    }
  );

  server.post<{
    Body: Vehicle;
  }>(
    "/vehicles",
    async (request, reply) => {
      try {
        const { name } = request.body;

        const vehicle = await server.vehicleManager.create({
          name,
        });

        return reply.code(201).send(vehicle);
      } catch (error) {
        server.log.error({ action: "error_while_creating_vehicle", error });
        return reply.code(500).send({});
      }
  });
}