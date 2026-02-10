import { VehicleList } from "@/components/VehicleList";
import { WithGlobalState } from "../../hocs/WithGlobalState";
import { OrderList } from "../components/OrderList";

export default function Home() {
  return (
    <WithGlobalState>
      <OrderList />
      <VehicleList />
    </WithGlobalState>
  );
}
