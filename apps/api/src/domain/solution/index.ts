import SolutionManager from "./manager";

function registerManager(decorator: (name: string, manager: any) => void) {
  decorator("solutionManager", SolutionManager);
}

export { registerManager };
