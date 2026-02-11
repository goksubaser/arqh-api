import { DispatchPage } from "@/components/DispatchPage";
import { WithGlobalState } from "../../hocs/WithGlobalState";

export default function Home() {
  return (
    <WithGlobalState>
      <DispatchPage />
    </WithGlobalState>
  );
}
