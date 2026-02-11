import type Redis from "ioredis";
import { injectable } from "tsyringe";
import { OrderService } from "./service";
import type { Order } from "types";

@injectable()
class OrderManager {
  constructor(private readonly orderService: OrderService) {}

  find(redis: Redis): Promise<Order[]> {
    return this.orderService.find(redis);
  }

  create(redis: Redis, order: Order) {
    return this.orderService.create(redis, order);
  }

  update(redis: Redis, id: string, order: Order) {
    return this.orderService.update(redis, id, order);
  }

  delete(redis: Redis, id: string) {
    return this.orderService.delete(redis, id);
  }
}

export default OrderManager;
