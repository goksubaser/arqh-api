import { injectable } from "tsyringe";
import { Vehicle } from "types";
import { VehicleModel } from "./model";
import { Service } from "../../service";

@injectable()
export class VehicleService extends Service<Vehicle, typeof VehicleModel> {
  constructor() {
    super(VehicleModel);
  }
}
