import { z } from "zod";

const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

const assignmentSchema = z.object({
  vehicle_id: z.string(),
  route: z.array(z.string()),
});

const solutionSchema = z.object({
  assignments: z.array(assignmentSchema),
});

export const apiSchemas = {
  getState: {
    response: { 200: solutionSchema },
  },
  postAssign: {
    body: z.object({
      orderId: z.string(),
      vehicleId: z.string(),
    }),
    response: { 200: z.object({}) },
  },
  postDropVehicle: {
    body: z.object({
      vehicleId: z.string(),
    }),
    response: { 200: z.object({}) },
  },
  postOptimize: {
    body: z.object({
      vehicleId: z.string(),
    }),
    response: { 200: z.object({}) },
  },
  postSave: {
    response: { 200: z.object({ success: z.boolean() }) },
  },
  postHydrate: {
    response: { 200: z.object({ hydrated: z.boolean() }) },
  },
};

export const vehicleSchema = z.object({
  id: z.string(),
  name: z.string(),
  capacity_kg: z.number(),
  start_location: locationSchema,
});

export const orderSchema = z.object({
  id: z.string(),
  weight_kg: z.number(),
  location: locationSchema,
  service_time_min: z.number(),
});

export const vehicleIdParamSchema = z.object({
  id: z.string(),
});

export const orderIdParamSchema = z.object({
  id: z.string(),
});

export const emptyResponseSchema = z.object({});

export const vehicleListSchema = vehicleSchema.array();
export const orderListSchema = orderSchema.array();
