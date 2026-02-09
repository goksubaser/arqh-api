import Manager from "./manager";

function registerManager(decorator: (name: string, manager: any) => void) {
  decorator("vehicleManager", Manager);
}

export { registerManager };
