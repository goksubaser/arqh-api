import Mongoose from "mongoose";
import { autoInjectable, inject } from "tsyringe";

@autoInjectable()
export class Service<Entity, Model extends Mongoose.Model<Entity>> {
  constructor(
    protected readonly model: Model,
    @inject("sanitize") protected readonly sanitize?: (value: string) => string
  ) {}
}
