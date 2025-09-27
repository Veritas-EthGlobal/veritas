import { NextResponse } from "next/server"
import { getMatch } from "@/lib/duel-store"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const matchId = String(searchParams.get("matchId") || "").trim()
  if (!matchId) return NextResponse.json({ error: "Missing matchId" }, { status: 400 })

  const s = getMatch(matchId)
  return NextResponse.json({
    user1Uploaded: Boolean(s?.user1),
    user2Uploaded: Boolean(s?.user2),
    resultReady: Boolean(s?.result),
  })
}
