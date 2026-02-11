import { api } from "@/constants/api";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const response = await fetch(`${api.url}/api/optimization-events`, {
    headers: {
      Accept: "text/event-stream",
      ...(req.headers.get("Last-Event-ID") && {
        "Last-Event-ID": req.headers.get("Last-Event-ID")!,
      }),
    },
  });

  if (!response.ok) {
    return new Response(null, { status: response.status });
  }

  if (!response.body) {
    return new Response(null, { status: 500 });
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
