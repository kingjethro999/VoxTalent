import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import crypto from "crypto"
import { setTranscript } from "@/lib/webhook-store"

export async function GET() {
  return NextResponse.json({ status: "webhook listening" }, { status: 200 })
}

export async function POST(req: NextRequest) {
  const secret = process.env.ELEVENLABS_CONVAI_WEBHOOK_SECRET

  if (!secret) {
    console.error("[Webhook] ELEVENLABS_CONVAI_WEBHOOK_SECRET not configured")
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    )
  }

  const { event, error } = await constructWebhookEvent(req, secret)

  if (error) {
    console.error("[Webhook] Validation error:", error)
    return NextResponse.json({ error: error }, { status: 401 })
  }

  if (event.type === "post_call_transcription") {
    console.log("[Webhook] Received post_call_transcription event")
    console.log("[Webhook] Conversation ID:", event.data.conversation_id)
    console.log("[Webhook] Agent ID:", event.data.agent_id)

    // Store the webhook data for processing
    const conversationId = event.data.conversation_id

    try {
      // Extract full transcript text from webhook
      const fullTranscript = event.data.transcript
        .map((turn: any) => `${turn.role === "agent" ? "Agent" : "User"}: ${turn.message}`)
        .join("\n")

      // Store transcript for frontend to retrieve
      setTranscript(conversationId, fullTranscript, event.data.agent_id)

      console.log("[Webhook] Transcript stored for conversation:", conversationId)
      console.log("[Webhook] Transcript length:", fullTranscript.length)
      console.log("[Webhook] Analysis available:", !!event.data.analysis)
    } catch (err) {
      console.error("[Webhook] Error processing transcript:", err)
    }
  } else if (event.type === "post_call_audio") {
    console.log("[Webhook] Received post_call_audio event")
    // Handle audio webhook if needed
  } else if (event.type === "call_initiation_failure") {
    console.log("[Webhook] Received call_initiation_failure event")
    // Handle call failure if needed
  }

  return NextResponse.json({ received: true }, { status: 200 })
}

const constructWebhookEvent = async (req: NextRequest, secret: string) => {
  const body = await req.text()
  const signatureHeader = req.headers.get("ElevenLabs-Signature")

  if (!signatureHeader) {
    return { event: null, error: "Missing signature header" }
  }

  const headers = signatureHeader.split(",")
  const timestamp = headers.find((e) => e.startsWith("t="))?.substring(2)
  const signature = headers.find((e) => e.startsWith("v0="))

  if (!timestamp || !signature) {
    return { event: null, error: "Invalid signature format" }
  }

  // Validate timestamp (30 minute tolerance)
  const reqTimestamp = Number(timestamp) * 1000
  const tolerance = Date.now() - 30 * 60 * 1000
  if (reqTimestamp < tolerance) {
    return { event: null, error: "Request expired" }
  }

  // Validate hash
  const message = `${timestamp}.${body}`
  const digest = "v0=" + crypto.createHmac("sha256", secret).update(message).digest("hex")

  if (signature !== digest) {
    return { event: null, error: "Invalid signature" }
  }

  const event = JSON.parse(body)
  return { event, error: null }
}

