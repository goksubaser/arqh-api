"use client";

import React, {
  createContext,
  useReducer,
  useContext,
  ReactNode,
  FunctionComponent,
	useEffect,
	useCallback,
} from "react";
import { Assignment, Order, Vehicle } from "types";

interface State {
  vehicles: Vehicle[];
  orders: Order[];
	assignments: Assignment[]
	unassignedOrders: Order[]
}

const initialState: State = {
	vehicles: [],
	orders: [],
	assignments: [],
	unassignedOrders: [],
};

export enum ActionKind {
	SetVehicles,
	SetOrders,
	SetAssignments,
	SetUnassignedOrders,
}

interface Action {
  type: ActionKind;
  payload: any;
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
		case ActionKind.SetVehicles:
			return { ...state, vehicles: action.payload };
		case ActionKind.SetOrders:
			return { ...state, orders: action.payload };
		case ActionKind.SetAssignments:
			return { ...state, assignments: action.payload };
		case ActionKind.SetUnassignedOrders:
			return { ...state, unassignedOrders: action.payload };
    default:
      return state;
  }
};

interface ContextType {
  state: State;
  dispatch: React.Dispatch<Action>;
}

const Context = createContext<ContextType>({
  state: initialState,
  dispatch: () => {},
});

export const Provider = Context.Provider;
export const useGlobalState = () => useContext(Context);

const HYDRATE_KEY = "dispatch-hydrated";

export const WithGlobalState: FunctionComponent<{children: ReactNode;}> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

	const fetchVehicles = useCallback(async () => {
		const response = await fetch("/api/vehicles");
		const data = await response.json();
		dispatch({ type: ActionKind.SetVehicles, payload: data });
	}, []);
	const fetchOrders = useCallback(async () => {
		const response = await fetch("/api/orders");
		const data = await response.json();
		dispatch({ type: ActionKind.SetOrders, payload: data });
	}, []);
	const fetchAssignments = useCallback(async () => {
		const response = await fetch("/api/assignments");
		const data = await response.json();
		dispatch({ type: ActionKind.SetAssignments, payload: data });
	}, []);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			if (typeof window === "undefined") return;
			const alreadyHydrated = sessionStorage.getItem(HYDRATE_KEY);
			if (!alreadyHydrated) {
				const hydrateRes = await fetch("/api/hydrate", { method: "POST" });
				if (cancelled || !hydrateRes.ok) return;
				sessionStorage.setItem(HYDRATE_KEY, "true");
			}
			if (cancelled) return;
			await Promise.all([
				fetchVehicles(),
				fetchOrders(),
				fetchAssignments(),
			]);
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		const unassignedOrders = state.orders.filter((order) => !state.assignments.some((assignment) => assignment.route.includes(order.id)));
		dispatch({ type: ActionKind.SetUnassignedOrders, payload: unassignedOrders });
	}, [state.orders, state.assignments]);
  return (
    <Provider value={{ state, dispatch }}>{children}</Provider>
  );
};