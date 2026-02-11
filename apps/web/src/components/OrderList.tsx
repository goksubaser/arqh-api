"use client";

import { FunctionComponent, useCallback, useState } from "react";
import { useGlobalState, ActionKind } from "../../hocs/WithGlobalState";
import { Order as OrderType } from "types";
const DRAG_TYPE_ORDER = "application/x-dispatch-order";

export const Order: FunctionComponent<{
  order: OrderType;
  onEdit?: () => void;
}> = ({ order, onEdit }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(DRAG_TYPE_ORDER, JSON.stringify(order));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.dataTransfer.clearData();
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="group relative cursor-grab rounded-lg border border-zinc-200 bg-white px-3 py-2.5 shadow-sm transition-shadow active:cursor-grabbing hover:shadow dark:border-zinc-700 dark:bg-zinc-800"
    >
      {onEdit && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="absolute right-2 top-2 rounded p-1 opacity-0 transition-opacity hover:bg-zinc-100 group-hover:opacity-100 dark:hover:bg-zinc-600"
          aria-label="Edit order"
        >
          <svg className="h-3.5 w-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      )}
      <div className="flex items-baseline justify-between gap-2 pr-6">
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

interface OrderListProps {
  onOpenOrderPopup?: (order?: OrderType) => void;
}

export const OrderList: FunctionComponent<OrderListProps> = ({ onOpenOrderPopup }) => {
  const { state, dispatch } = useGlobalState();
  const [dropTargetActive, setDropTargetActive] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/save", { method: "POST" });
      if (!res.ok) throw new Error("Save failed");
      const data = await res.json();
      if (!data.success) throw new Error("Save failed");
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(DRAG_TYPE_ORDER)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTargetActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropTargetActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDropTargetActive(false);

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
      const nextAssignments = state.assignments.map((a) => ({
        ...a,
        route: a.route.filter((id) => id !== orderId),
      }));

      dispatch({ type: ActionKind.SetAssignments, payload: nextAssignments });

      try {
        const res = await fetch("/api/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, vehicleId: "" }),
        });
        if (!res.ok) throw new Error("Unassign failed");
      } catch {
        dispatch({ type: ActionKind.SetAssignments, payload: previousAssignments });
      }
    },
    [state.assignments, dispatch]
  );

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
      <header className="flex shrink-0 items-start justify-between gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Unassigned orders
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {state.unassignedOrders.length} order{state.unassignedOrders.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => onOpenOrderPopup?.()}
            className="rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
          >
            Add order
          </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="shrink-0 rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
        >
          {saving ? "Saving…" : "Save Plan"}
        </button>
        </div>
      </header>
      <ul
        className={`flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2 transition-colors ${dropTargetActive ? "ring-2 ring-inset ring-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {state.unassignedOrders.map((order) => (
          <li key={order.id}>
            <Order order={order} onEdit={() => onOpenOrderPopup?.(order)} />
          </li>
        ))}
      </ul>
    </aside>
  );
}
