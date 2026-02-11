import OrderManager from "./manager";

function registerManager(decorator: (name: string, manager: any) => void) {
  decorator("orderManager", OrderManager);
}

export { registerManager };
