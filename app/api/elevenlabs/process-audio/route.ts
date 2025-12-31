import { type NextRequest, NextResponse } from "next/server"

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as Blob
    const agentId = formData.get("agent_id") as string

    if (!audioFile || !agentId) {
      return NextResponse.json({ success: false, error: "Missing audio or agent_id" }, { status: 400 })
    }

    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json({ success: false, error: "ElevenLabs API key not configured" }, { status: 500 })
    }

    const audioBuffer = await audioFile.arrayBuffer()
    const audioBase64 = Buffer.from(audioBuffer).toString("base64")

    // Initialize or continue conversation with the agent
    const agentResponse = await fetch(`${ELEVENLABS_API_BASE}/convai/agents/${agentId}/interact`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio: audioBase64,
        audio_format: "wav",
      }),
    })

    if (!agentResponse.ok) {
      const errorData = await agentResponse.text()
      console.error("ElevenLabs API error:", errorData)
      return NextResponse.json(
        { success: false, error: "Failed to process with agent" },
        { status: agentResponse.status },
      )
    }

    const result = await agentResponse.json()

    return NextResponse.json({
      success: true,
      agentResponse: result.response || result.text || "Response received",
      conversationComplete: result.finished || false,
      data: result.extracted_data || null,
    })
  } catch (error) {
    console.error("Error processing audio:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
