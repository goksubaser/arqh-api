export interface Assignment {
  vehicle_id: string;
  route: string[];
}

export interface Solution {
  assignments: Assignment[];
}
