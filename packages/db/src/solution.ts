import { Schema, model } from "mongoose";
import { Solution } from "types";

const SolutionSchema = new Schema<Solution>(
  {
    assignments: [
      {
        vehicle_id: { type: String, required: true },
        route: [{ type: String }],
      },
    ],
  },
  { timestamps: true }
);

export const SolutionModel = model<Solution>("Solution", SolutionSchema, "solutions");
