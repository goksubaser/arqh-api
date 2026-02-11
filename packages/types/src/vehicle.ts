import { Location } from "./location";

export interface Vehicle {
  id: string;
  name: string;
  capacity_kg: number;
  start_location: Location;
  deleted?: boolean;
}
