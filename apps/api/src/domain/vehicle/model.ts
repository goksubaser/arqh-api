import { Schema, model } from "mongoose";

export interface Vehicle {
  name: string;
}

const VehicleSchema = new Schema<Vehicle>(
  {
    name: {
      type: String,
      required: [true, "Please provide a name for this brand."],
      maxlength: [100, "Name cannot be more than 100 characters"],
      unique: true,
    },
  },
  { timestamps: true },
);

export const VehicleModel = model<Vehicle>("Vehicle", VehicleSchema, "vehicles");