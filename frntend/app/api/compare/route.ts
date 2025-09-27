import { NextResponse } from "next/server"

// Simple helper to delay without blocking
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms))

export async function POST(req: Request) {
  const formData = await req.formData()

  // We support either a file or text for each user.
  // Files are optional; we don't need to persist them for this simulation.
  const user1Text = (formData.get("user1Text") as string) || ""
  const user2Text = (formData.get("user2Text") as string) || ""

  // Grab file names if present (to show in results)
  const user1File = formData.get("user1File") as File | null
  const user2File = formData.get("user2File") as File | null

  // Simulate backend processing while the UI animates progress bars.
  await sleep(3300)

  // Mock scoring
  const mkScore = () => Math.floor(Math.random() * 101)
  const user1Scores = { quality: mkScore(), performance: mkScore(), style: mkScore() }
  const user2Scores = { quality: mkScore(), performance: mkScore(), style: mkScore() }
  const user1Total = user1Scores.quality + user1Scores.performance + user1Scores.style
  const user2Total = user2Scores.quality + user2Scores.performance + user2Scores.style

  const winner = user1Total === user2Total ? "Tie" : user1Total > user2Total ? "User 1" : "User 2"

  return NextResponse.json({
    user1: {
      name: user1File?.name || (user1Text ? "Pasted Text" : "No Input"),
      scores: user1Scores,
      total: user1Total,
    },
    user2: {
      name: user2File?.name || (user2Text ? "Pasted Text" : "No Input"),
      scores: user2Scores,
      total: user2Total,
    },
    decision: winner,
  })
}
