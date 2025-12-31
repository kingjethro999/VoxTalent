import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getLatestTranscriptForAgent } from "@/lib/webhook-store"

export async function GET(
  req: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const agentId = params.agentId
  const sinceTimestamp = req.nextUrl.searchParams.get("since")

  if (!agentId) {
    return NextResponse.json({ error: "Agent ID required" }, { status: 400 })
  }

  // Get latest transcript for this agent
  const result = getLatestTranscriptForAgent(
    agentId,
    sinceTimestamp ? Number(sinceTimestamp) : undefined
  )

  if (result) {
    return NextResponse.json({ ...result, found: true }, { status: 200 })
  }

  return NextResponse.json({ transcript: null, found: false }, { status: 200 })
}

