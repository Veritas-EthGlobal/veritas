import { NextResponse } from "next/server"
import { getMatch } from "@/lib/duel-store"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const matchId = String(searchParams.get("matchId") || "").trim()
  if (!matchId) return NextResponse.json({ error: "Missing matchId" }, { status: 400 })

  const s = getMatch(matchId)
  if (!s?.result) return NextResponse.json({ error: "Result not ready" }, { status: 404 })
  return NextResponse.json(s.result)
}
