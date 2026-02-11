"use client";

import { useState } from "react";
import type { Order, Vehicle } from "types";
import { MasterDataPopup } from "./MasterDataPopup";
import { OrderList } from "./OrderList";
import { VehicleList } from "./VehicleList";

export function DispatchPage() {
  const [orderPopup, setOrderPopup] = useState<Order | null | "create">(null);
  const [vehiclePopup, setVehiclePopup] = useState<Vehicle | null | "create">(null);

  return (
    <>
      <OrderList
        onOpenOrderPopup={(order) => setOrderPopup(order ?? "create")}
      />
      <VehicleList
        onOpenOrderPopup={(order) => setOrderPopup(order)}
        onOpenVehiclePopup={(vehicle) => setVehiclePopup(vehicle ?? "create")}
      />
      {orderPopup !== null && (
        <MasterDataPopup
          mode="order"
          initialData={orderPopup === "create" ? null : orderPopup}
          onClose={() => setOrderPopup(null)}
        />
      )}
      {vehiclePopup !== null && (
        <MasterDataPopup
          mode="vehicle"
          initialData={vehiclePopup === "create" ? null : vehiclePopup}
          onClose={() => setVehiclePopup(null)}
        />
      )}
    </>
  );
}
