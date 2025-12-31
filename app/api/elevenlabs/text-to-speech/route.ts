import { type NextRequest, NextResponse } from "next/server"

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1"
const INTERPREP_VOICE_ID = process.env.INTERVIEWPREP_VOICE_ID || "xKhbyU7E3bC6T89Kn26c"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { success: false, error: "Text is required" },
        { status: 400 }
      )
    }

    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { success: false, error: "ElevenLabs API key not configured" },
        { status: 500 }
      )
    }

    console.log("[ElevenLabs TTS] Generating speech for text length:", text.length)

    // Call ElevenLabs TTS API
    const response = await fetch(
      `${ELEVENLABS_API_BASE}/text-to-speech/${INTERPREP_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error("[ElevenLabs TTS] API error:", errorData)
      return NextResponse.json(
        { success: false, error: "Failed to generate speech" },
        { status: response.status }
      )
    }

    // Get audio as ArrayBuffer
    const audioBuffer = await response.arrayBuffer()
    const audioBase64 = Buffer.from(audioBuffer).toString("base64")

    console.log("[ElevenLabs TTS] Speech generated successfully")

    return NextResponse.json({
      success: true,
      audio: audioBase64,
      format: "mp3",
    })
  } catch (error) {
    console.error("[ElevenLabs TTS] Error:", error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

