import { NextResponse } from "next/server"
import { upsertSubmission } from "@/lib/duel-store"

export async function POST(req: Request) {
  const form = await req.formData()
  const matchId = String(form.get("matchId") || "").trim()
  const role = String(form.get("role") || "").trim() as "user1" | "user2" | ""

  if (!matchId) return NextResponse.json({ error: "Missing matchId" }, { status: 400 })
  if (role !== "user1" && role !== "user2") return NextResponse.json({ error: "Invalid role" }, { status: 400 })

  const text = (form.get("text") as string) || ""
  const file = form.get("file") as File | null

  let name = "No Input"
  let length = 0
  let textSnippet = ""

  if (file) {
    name = file.name
    const buf = await file.arrayBuffer()
    length = buf.byteLength
    // Try to derive a short snippet if text-like
    try {
      const asText = new TextDecoder().decode(buf).slice(0, 200)
      textSnippet = asText
    } catch {
      textSnippet = ""
    }
  } else if (text) {
    name = "Pasted Text"
    length = text.length
    textSnippet = text.slice(0, 200)
  } else {
    return NextResponse.json({ error: "Missing file or text" }, { status: 400 })
  }

  upsertSubmission(matchId, role, {
    name,
    length,
    textSnippet,
    uploadedAt: Date.now(),
  })

  return NextResponse.json({ ok: true })
}
