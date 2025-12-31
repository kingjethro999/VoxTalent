import { type NextRequest, NextResponse } from "next/server"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // No input needed - we'll generate general resume questions

    if (!GEMINI_API_KEY) {
      console.error("[Gemini API] GEMINI_API_KEY is not set in environment variables")
      return NextResponse.json(
        { success: false, error: "Gemini API key not configured. Please set GEMINI_API_KEY in your .env.local file and restart the server." },
        { status: 500 }
      )
    }

    const prompt = `You are a friendly, professional resume assistant conducting a voice interview to gather a user's professional information. Your goal is to collect comprehensive resume data through natural conversation.

Generate 10-15 conversational questions that will help you gather:
1. Personal information (name, title, location, contact details)
2. Professional summary/profile
3. Work experience (companies, roles, dates, locations, responsibilities, achievements)
4. Education (degrees, institutions, dates, locations)
5. Skills (technical and soft skills)
6. Languages spoken
7. References (optional)

IMPORTANT GUIDELINES:
- Questions should be natural and conversational, not robotic
- Ask one thing at a time
- Start with basic information and progress to more detailed questions
- Make it feel like a friendly conversation, not an interrogation
- Don't mention JSON or structured data
- Questions should flow naturally from one to the next

Format your response as a JSON array of question objects, each with:
- "question": The question text (natural, conversational)
- "category": One of: "personal", "profile", "experience", "education", "skills", "languages", "references"
- "order": Number indicating the sequence (1, 2, 3, etc.)

Example format:
[
  {
    "question": "Hi! I'm here to help you create an amazing resume. Let's start with the basics - what's your full name?",
    "category": "personal",
    "order": 1
  },
  {
    "question": "Great! What's your current professional title or the role you're targeting?",
    "category": "personal",
    "order": 2
  },
  {
    "question": "Tell me a bit about yourself professionally. What would you like potential employers to know about you?",
    "category": "profile",
    "order": 3
  }
]

Return ONLY the JSON array, no additional text or markdown formatting.`

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
        { success: false, error: "Failed to generate questions" },
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
    let questions
    try {
      const cleanedText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim()
      questions = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error("[Gemini API] Failed to parse questions JSON:", parseError)
      return NextResponse.json(
        { success: false, error: "Failed to parse questions from Gemini response" },
        { status: 500 }
      )
    }

    console.log("[Gemini API] Generated", questions.length, "resume questions")

    return NextResponse.json({
      success: true,
      questions: questions,
    })
  } catch (error) {
    console.error("[Gemini API] Error generating questions:", error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

