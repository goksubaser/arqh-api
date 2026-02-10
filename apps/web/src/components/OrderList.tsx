"use client";

import { FunctionComponent } from "react";
import { useGlobalState } from "../../hocs/WithGlobalState";
import { Order as OrderType } from "types";

const DRAG_TYPE_ORDER = "application/x-dispatch-order";

const Order: FunctionComponent<{ order: OrderType }> = ({ order }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(DRAG_TYPE_ORDER, JSON.stringify(order));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // If dropped outside a valid drop target, browser keeps source in place.
    // No x/y tracking; we only remove from list when a future vehicle column drop handler runs.
    e.dataTransfer.clearData();
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="cursor-grab rounded-lg border border-zinc-200 bg-white px-3 py-2.5 shadow-sm transition-shadow active:cursor-grabbing hover:shadow dark:border-zinc-700 dark:bg-zinc-800"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {order.id}
        </span>
        <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
          {order.weight_kg} kg
        </span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <span>{order.service_time_min} min</span>
        <span>·</span>
        <span>{order.location.lat.toFixed(4)}, {order.location.lng.toFixed(4)}</span>
      </div>
    </div>
  );
};

export { DRAG_TYPE_ORDER };

export const OrderList: FunctionComponent = () => {
  const { state } = useGlobalState();

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
      <header className="shrink-0 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Unassigned orders
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {state.unassignedOrders.length} order{state.unassignedOrders.length !== 1 ? "s" : ""}
        </p>
      </header>
      <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
        {state.unassignedOrders.map((order) => (
          <li key={order.id}>
            <Order order={order} />
          </li>
        ))}
      </ul>
    </aside>
  );
}
