import { Model } from "mongoose";
import { autoInjectable } from "tsyringe";
import { Service as BaseService } from "../service";

@autoInjectable()
export class Manager<
  Entity,
  Service extends BaseService<Entity, Model<Entity>>
> {
  constructor(protected readonly service: Service) {}

  create(entity: Entity) {
    return this.service.create(entity);
  }

  // findOne(id: string) {
  //   return this.service.findOne(id);
  // }

  find(filter: Partial<Entity> = {}) {
    return this.service.find(filter);
  }

  // update(id: string, data: Partial<Entity>) {
  //   return this.service.update(id, data);
  // }
}
