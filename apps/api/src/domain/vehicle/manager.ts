import { Manager } from "../../manager";
import { Logger } from "../../interface/logger";
import { inject, injectable } from "tsyringe";
import { Vehicle } from "./model";
import { VehicleService } from "./service";

@injectable()
class VehicleManager extends Manager<Vehicle, VehicleService> {
  constructor(service: VehicleService, @inject("Logger") logger: Logger) {
    super(service);
  }
}

export default VehicleManager;
