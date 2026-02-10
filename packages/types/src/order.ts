import { Location } from "./location";

export interface Order {
  id: string;
  weight_kg: number;
  location: Location;
  service_time_min: number;
}
