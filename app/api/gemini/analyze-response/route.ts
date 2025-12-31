import { type NextRequest, NextResponse } from "next/server"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question, answer, resume, jobTitle, jobDescription, conversationHistory } = body

    if (!question || !answer) {
      return NextResponse.json(
        { success: false, error: "Question and answer are required" },
        { status: 400 }
      )
    }

    console.log("[Gemini API] Analyzing interview response")

    const historyContext = conversationHistory && conversationHistory.length > 0
      ? `\n\nPrevious Q&A:\n${conversationHistory.map((item: any) => `Q: ${item.question}\nA: ${item.answer}`).join("\n\n")}`
      : ""

    const prompt = `You are an expert interview coach providing real-time feedback during a mock interview.

CANDIDATE'S RESUME:
${resume || "Not provided"}

JOB TITLE: ${jobTitle || "Not specified"}

JOB DESCRIPTION:
${jobDescription || "Not provided"}
${historyContext}

CURRENT QUESTION:
${question}

CANDIDATE'S ANSWER:
${answer}

Provide a brief, constructive analysis of this answer. Focus on:
1. **Strengths** - What did they do well? (1-2 sentences)
2. **Areas for Improvement** - What could be better? (1-2 sentences)
3. **Score** - Rate this answer from 0-100
4. **Suggestion** - One specific tip for improvement (1 sentence)

Format your response as JSON:
{
  "strengths": "...",
  "improvements": "...",
  "score": 85,
  "suggestion": "..."
}

Return ONLY the JSON object, no additional text or markdown formatting.`

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Gemini API key not configured" },
        { status: 500 }
      )
    }

    const response = await fetch(`${GEMINI_API_BASE}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
        }
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("[Gemini API] Error:", errorData)
      return NextResponse.json(
        { success: false, error: "Failed to analyze response" },
        { status: response.status }
      )
    }

    const result = await response.json()
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      return NextResponse.json(
        { success: false, error: "No response from Gemini" },
        { status: 500 }
      )
    }

    // Parse JSON from response
    let analysis
    try {
      const cleanedText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim()
      analysis = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error("[Gemini API] Failed to parse analysis JSON:", parseError)
      return NextResponse.json(
        { success: false, error: "Failed to parse analysis from Gemini response" },
        { status: 500 }
      )
    }

    console.log("[Gemini API] Analysis generated, score:", analysis.score)

    return NextResponse.json({
      success: true,
      analysis: analysis,
    })
  } catch (error) {
    console.error("[Gemini API] Error analyzing response:", error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

