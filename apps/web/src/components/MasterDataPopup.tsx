"use client";

import { FunctionComponent, useCallback, useState } from "react";
import type { Order, Vehicle } from "types";
import { useGlobalState, ActionKind } from "../../hocs/WithGlobalState";

type PopupMode = "order" | "vehicle";

interface MasterDataPopupProps {
  mode: PopupMode;
  initialData?: Order | Vehicle | null;
  onClose: () => void;
}

const emptyOrder: Order = {
  id: "",
  weight_kg: 0,
  location: { lat: 0, lng: 0 },
  service_time_min: 0,
};

const emptyVehicle: Vehicle = {
  id: "",
  name: "",
  capacity_kg: 0,
  start_location: { lat: 0, lng: 0 },
};

export const MasterDataPopup: FunctionComponent<MasterDataPopupProps> = ({
  mode,
  initialData,
  onClose,
}) => {
  const { state, dispatch } = useGlobalState();
  const isEdit = !!initialData;

  const [form, setForm] = useState<Order | Vehicle>(() =>
    initialData ? { ...initialData } : mode === "order" ? { ...emptyOrder } : { ...emptyVehicle }
  );

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleChange = useCallback(
    (field: string, value: string | number | { lat: number; lng: number }) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleLocationChange = useCallback(
    (field: "location" | "start_location", coord: "lat" | "lng", value: number) => {
      setForm((prev) => {
        const loc = (prev as any)[field] ?? { lat: 0, lng: 0 };
        return { ...prev, [field]: { ...loc, [coord]: value } };
      });
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    const previousOrders = state.orders;
    const previousVehicles = state.vehicles;

    if (mode === "order") {
      const order = form as Order;
      if (!order.id.trim()) {
        setSubmitting(false);
        return;
      }
      if (isEdit) {
        const nextOrders = previousOrders.map((o) =>
          o.id === (initialData as Order).id ? order : o
        );
        dispatch({ type: ActionKind.SetOrders, payload: nextOrders });
      } else {
        if (previousOrders.some((o) => o.id === order.id)) {
          setSubmitting(false);
          return;
        }
        dispatch({ type: ActionKind.SetOrders, payload: [...previousOrders, order] });
      }

      try {
        const url = isEdit ? `/api/orders/${(initialData as Order).id}` : "/api/orders";
        const res = await fetch(url, {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(order),
        });
        if (!res.ok) throw new Error("Request failed");
      } catch {
        dispatch({ type: ActionKind.SetOrders, payload: previousOrders });
      }
    } else {
      const vehicle = form as Vehicle;
      if (!vehicle.id.trim()) {
        setSubmitting(false);
        return;
      }
      if (isEdit) {
        const nextVehicles = previousVehicles.map((v) =>
          v.id === (initialData as Vehicle).id ? vehicle : v
        );
        dispatch({ type: ActionKind.SetVehicles, payload: nextVehicles });
      } else {
        if (previousVehicles.some((v) => v.id === vehicle.id)) {
          setSubmitting(false);
          return;
        }
        dispatch({ type: ActionKind.SetVehicles, payload: [...previousVehicles, vehicle] });
      }

      try {
        const url = isEdit ? `/api/vehicles/${(initialData as Vehicle).id}` : "/api/vehicles";
        const res = await fetch(url, {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(vehicle),
        });
        if (!res.ok) throw new Error("Request failed");
      } catch {
        dispatch({ type: ActionKind.SetVehicles, payload: previousVehicles });
      }
    }

    setSubmitting(false);
    onClose();
  }, [mode, form, isEdit, initialData, state.orders, state.vehicles, dispatch, onClose]);

  const handleDelete = useCallback(async () => {
    if (!isEdit) return;
    setDeleting(true);
    const previousOrders = state.orders;
    const previousVehicles = state.vehicles;

    if (mode === "order") {
      const id = (initialData as Order).id;
      dispatch({ type: ActionKind.SetOrders, payload: previousOrders.filter((o) => o.id !== id) });
      dispatch({
        type: ActionKind.SetAssignments,
        payload: state.assignments.map((a) => ({
          ...a,
          route: a.route.filter((oid) => oid !== id),
        })),
      });

      try {
        const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");
      } catch {
        dispatch({ type: ActionKind.SetOrders, payload: previousOrders });
        dispatch({ type: ActionKind.SetAssignments, payload: state.assignments });
      }
    } else {
      const id = (initialData as Vehicle).id;
      dispatch({ type: ActionKind.SetVehicles, payload: previousVehicles.filter((v) => v.id !== id) });
      dispatch({
        type: ActionKind.SetAssignments,
        payload: state.assignments.filter((a) => a.vehicle_id !== id),
      });

      try {
        const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");
      } catch {
        dispatch({ type: ActionKind.SetVehicles, payload: previousVehicles });
        dispatch({ type: ActionKind.SetAssignments, payload: state.assignments });
      }
    }

    setDeleting(false);
    onClose();
  }, [
    mode,
    isEdit,
    initialData,
    state.orders,
    state.vehicles,
    state.assignments,
    dispatch,
    onClose,
  ]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {isEdit ? `Edit ${mode}` : `Add ${mode}`}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <form
          className="space-y-4 px-4 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          {mode === "order" ? (
            <>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  ID
                </label>
                <input
                  type="text"
                  value={(form as Order).id}
                  onChange={(e) => handleChange("id", e.target.value)}
                  disabled={isEdit}
                  className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm disabled:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-700 dark:disabled:bg-zinc-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  min={0}
                  value={(form as Order).weight_kg}
                  onChange={(e) => handleChange("weight_kg", Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Lat
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={(form as Order).location.lat}
                    onChange={(e) =>
                      handleLocationChange("location", "lat", Number(e.target.value) || 0)
                    }
                    className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Lng
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={(form as Order).location.lng}
                    onChange={(e) =>
                      handleLocationChange("location", "lng", Number(e.target.value) || 0)
                    }
                    className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Service time (min)
                </label>
                <input
                  type="number"
                  min={0}
                  value={(form as Order).service_time_min}
                  onChange={(e) => handleChange("service_time_min", Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  ID
                </label>
                <input
                  type="text"
                  value={(form as Vehicle).id}
                  onChange={(e) => handleChange("id", e.target.value)}
                  disabled={isEdit}
                  className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm disabled:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-700 dark:disabled:bg-zinc-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Name
                </label>
                <input
                  type="text"
                  value={(form as Vehicle).name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Capacity (kg)
                </label>
                <input
                  type="number"
                  min={0}
                  value={(form as Vehicle).capacity_kg}
                  onChange={(e) => handleChange("capacity_kg", Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Start Lat
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={(form as Vehicle).start_location.lat}
                    onChange={(e) =>
                      handleLocationChange("start_location", "lat", Number(e.target.value) || 0)
                    }
                    className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Start Lng
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={(form as Vehicle).start_location.lng}
                    onChange={(e) =>
                      handleLocationChange("start_location", "lng", Number(e.target.value) || 0)
                    }
                    className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-700"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-700">
            <div>
              {isEdit && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded border border-zinc-300 bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-700 dark:hover:bg-zinc-600"
              >
                {submitting ? "Saving…" : isEdit ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
