import { api } from "@/constants/api";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	try {
		const url = `${api.url}/api/hydrate`;
		const response = await fetch(url, { method: "POST" });
		const data = await response.json();

		return NextResponse.json(data);
	} catch (error) {
		return NextResponse.json({ error: "Failed to hydrate" }, { status: 500 });
	}
}