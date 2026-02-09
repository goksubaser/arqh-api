import Mongoose from "mongoose";
import { autoInjectable, inject } from "tsyringe";

@autoInjectable()
export class Service<Entity, Model extends Mongoose.Model<Entity>> {
  constructor(
    protected readonly model: Model,
    @inject("sanitize") protected readonly sanitize?: (value: string) => string
  ) {}

  create(data: Entity) {
    return this.model.create(data);
  }

  // findOne(id: string) {
  //   return this.model.findOne({ _id: id });
  // }

  find(filter: Partial<Entity> = {}) {
    return this.model.find(filter);
  }

  // update(id: string, data: Partial<Entity>) {
  //   return this.model.findByIdAndUpdate(id, data, { new: true });
  // }
}
