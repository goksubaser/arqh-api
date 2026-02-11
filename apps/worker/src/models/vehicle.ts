import { Schema, model } from "mongoose";
import { Vehicle } from "types";

const VehicleSchema = new Schema<Vehicle>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    capacity_kg: { type: Number, required: true },
    start_location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
  },
  { timestamps: true }
);

export const VehicleModel = model<Vehicle>("Vehicle", VehicleSchema, "vehicles");
