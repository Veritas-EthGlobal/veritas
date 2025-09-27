import { NextResponse } from "next/server"
import { getMatch, setResult, type DuelResult } from "@/lib/duel-store"

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function POST(req: Request) {
  const form = await req.formData()
  const matchId = String(form.get("matchId") || "").trim()
  if (!matchId) return NextResponse.json({ error: "Missing matchId" }, { status: 400 })

  const s = getMatch(matchId)
  if (!s?.user1 || !s?.user2) {
    return NextResponse.json({ error: "Both users must upload first" }, { status: 400 })
  }

  // Simulate backend processing to align with UI checkpoints
  await sleep(3300)

  const mk = () => Math.floor(Math.random() * 101)
  const u1 = { quality: mk(), performance: mk(), style: mk() }
  const u2 = { quality: mk(), performance: mk(), style: mk() }
  const t1 = u1.quality + u1.performance + u1.style
  const t2 = u2.quality + u2.performance + u2.style
  const decision: DuelResult["decision"] = t1 === t2 ? "Tie" : t1 > t2 ? "User 1" : "User 2"

  const result: DuelResult = {
    user1: { name: s.user1.name, scores: u1, total: t1 },
    user2: { name: s.user2.name, scores: u2, total: t2 },
    decision,
  }

  setResult(matchId, result)
  return NextResponse.json(result)
}
