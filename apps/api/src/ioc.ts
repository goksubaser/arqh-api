import { FastifyServer } from "./interface/server";
import { container } from "tsyringe";
import { glob } from "glob";
import path from "path";
import { sanitize, sanitizeForHtml } from "./util/sanitize";

async function getDomains(): Promise<Array<string>> {
  return glob(path.join(__dirname, "./domain/*/index.*"));
}

export async function decorateManagers(server: FastifyServer) {
  container.register<typeof server.log>("Logger", { useValue: server.log });
  container.register("sanitize", {
    useValue: sanitize,
  });
  container.register<(value: string) => string>("sanitizeForHtml", {
    useValue: sanitizeForHtml,
  });

  const domainPaths = await getDomains();
  const modules: Array<{
    registerManager: (decorate: any) => void;
  }> = [];
  for (let i = 0; i < domainPaths.length; i++) {
    modules.push(await import(domainPaths[i]));
  }

  for (const module of modules) {
    module.registerManager((name: string, manager: any) => {
      server.decorate(name, container.resolve(manager));
    });
  }
}
