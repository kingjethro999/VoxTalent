import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getTranscript, hasTranscript } from "@/lib/webhook-store"

export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const conversationId = params.conversationId

  if (!conversationId) {
    return NextResponse.json({ error: "Conversation ID required" }, { status: 400 })
  }

  // Retrieve transcript from store
  if (hasTranscript(conversationId)) {
    const transcript = getTranscript(conversationId)!
    return NextResponse.json({ transcript, found: true }, { status: 200 })
  }

  return NextResponse.json({ transcript: null, found: false }, { status: 200 })
}

