import { api } from "@/constants/api";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = await fetch(`${api.url}/api/save`, { method: "POST" });
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
