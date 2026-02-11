import { Schema, model } from "mongoose";
import { Order } from "types";

const OrderSchema = new Schema<Order>(
  {
    id: { type: String, required: true, unique: true },
    weight_kg: { type: Number, required: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    service_time_min: { type: Number, required: true },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const OrderModel = model<Order>("Order", OrderSchema, "orders");
