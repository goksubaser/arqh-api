"use client";

import { FunctionComponent, useCallback, useState } from "react";
import type { Vehicle as VehicleType } from "types";
import { useGlobalState, ActionKind } from "../../hocs/WithGlobalState";
import { DRAG_TYPE_ORDER, Order } from "./OrderList";

const Vehicle: FunctionComponent<{ vehicle: VehicleType }> = ({ vehicle }) => {
  const { state, dispatch } = useGlobalState();
  const [dropping, setDropping] = useState(false);
  const orderIds = state.assignments.find((a) => a.vehicle_id === vehicle.id)?.route ?? [];
  const orders = state.orders.filter((order) => orderIds.includes(order.id));

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(DRAG_TYPE_ORDER)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    e.currentTarget.classList.add("ring-2", "ring-blue-400", "ring-offset-2");
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.currentTarget.classList.remove("ring-2", "ring-blue-400", "ring-offset-2");
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.currentTarget.classList.remove("ring-2", "ring-blue-400", "ring-offset-2");

      const raw = e.dataTransfer.getData(DRAG_TYPE_ORDER);
      if (!raw) return;
      let orderId: string;
      try {
        const order = JSON.parse(raw);
        orderId = order?.id;
      } catch {
        return;
      }
      if (!orderId) return;

      const previousAssignments = state.assignments;
      const nextAssignments = (() => {
        const cleanedAssignments = previousAssignments.map(a => ({
          ...a,
          route: a.route.filter(id => id !== orderId)
        }));

        const existing = cleanedAssignments.find((a) => a.vehicle_id === vehicle.id);
        if (existing) {
          return cleanedAssignments.map((a) =>
            a.vehicle_id === vehicle.id
              ? { ...a, route: [...a.route, orderId] }
              : a
          );
        }
        return [...cleanedAssignments, { vehicle_id: vehicle.id, route: [orderId] }];
      })();

      dispatch({ type: ActionKind.SetAssignments, payload: nextAssignments });

      try {
        const res = await fetch("/api/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, vehicleId: vehicle.id }),
        });
        if (!res.ok) throw new Error("Assign failed");
      } catch {
        dispatch({ type: ActionKind.SetAssignments, payload: previousAssignments });
      }
    },
    [vehicle.id, state.assignments, dispatch]
  );

  const handleDropAll = useCallback(async () => {
    if (orders.length === 0) return;
    setDropping(true);
    const previousAssignments = state.assignments;
    const nextAssignments = state.assignments.map((a) =>
      a.vehicle_id === vehicle.id ? { ...a, route: [] } : a
    );
    dispatch({ type: ActionKind.SetAssignments, payload: nextAssignments });
    try {
      const res = await fetch("/api/drop-vehicle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId: vehicle.id }),
      });
      if (!res.ok) throw new Error("Drop vehicle failed");
    } catch {
      dispatch({ type: ActionKind.SetAssignments, payload: previousAssignments });
    } finally {
      setDropping(false);
    }
  }, [vehicle.id, orders.length, state.assignments, dispatch]);

  return (
    <div className="flex w-60 h-[50%] flex-col rounded-lg border border-zinc-200 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-800/50">
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              {vehicle.name}
            </h3>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              {vehicle.id}
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              Capacity: {vehicle.capacity_kg} kg
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Start: {vehicle.start_location.lat.toFixed(2)}, {vehicle.start_location.lng.toFixed(2)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleDropAll}
            disabled={orders.length === 0 || dropping}
            className="shrink-0 rounded border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
          >
            {dropping ? "Dropping…" : "Drop all"}
          </button>
        </div>
      </div>

      <div
        className="min-h-[120px] flex-1 space-y-2 p-3 transition-colors"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {orders.length === 0 ? (
          <p className="rounded border border-dashed border-zinc-300 py-6 text-center text-sm text-zinc-400 dark:border-zinc-600 dark:text-zinc-500">
            Drop orders here
          </p>
        ) : (
          orders.map((order) => (
            <Order key={order.id} order={order} />
          ))
        )}
      </div>
    </div>
  );
}

export const VehicleList: FunctionComponent = () => {
  const { state } = useGlobalState();
  
  return (
    <>
      {state.vehicles.map((vehicle) => (
        <Vehicle key={vehicle.id} vehicle={vehicle} />
      ))}
    </>
  );
}
