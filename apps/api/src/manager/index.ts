import { Model } from "mongoose";
import { autoInjectable } from "tsyringe";
import { Service as BaseService } from "../service";

@autoInjectable()
export class Manager<
  Entity,
  Service extends BaseService<Entity, Model<Entity>>
> {
  constructor(protected readonly service: Service) {}
}
