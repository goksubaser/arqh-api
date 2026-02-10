import { api } from "@/constants/api";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const url = `${api.url}/api/state`;
    const response = await fetch(url);
    const data = await response.json();
    return NextResponse.json(data.assignments);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch solution" },
      { status: 500 }
    );
  }
}
