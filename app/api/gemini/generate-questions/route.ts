import { type NextRequest, NextResponse } from "next/server"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { resume, jobTitle, jobDescription } = body

    if (!resume || !jobTitle || !jobDescription) {
      return NextResponse.json(
        { success: false, error: "Resume, job title, and job description are required" },
        { status: 400 }
      )
    }

    console.log("[Gemini API] Generating interview questions for:", jobTitle)

    const prompt = `You are an expert interviewer conducting a mock interview. Your task is to generate a structured set of interview questions based on the candidate's resume and the job description.

RESUME:
${resume}

JOB TITLE: ${jobTitle}

JOB DESCRIPTION:
${jobDescription}

Generate 8-12 interview questions that:
1. Assess the candidate's fit for this specific role
2. Test their technical skills and experience (if applicable)
3. Evaluate their problem-solving abilities
4. Understand their motivation and career goals
5. Include behavioral questions (STAR method)
6. Are relevant to the job description and their resume

Format your response as a JSON array of question objects, each with:
- "question": The question text (natural, conversational)
- "category": One of: "technical", "behavioral", "situational", "motivational"
- "order": Number indicating the sequence (1, 2, 3, etc.)

Example format:
[
  {
    "question": "Tell me about yourself and why you're interested in this role.",
    "category": "motivational",
    "order": 1
  },
  {
    "question": "Can you walk me through a challenging project you worked on?",
    "category": "behavioral",
    "order": 2
  }
]

Return ONLY the JSON array, no additional text or markdown formatting.`

    if (!GEMINI_API_KEY) {
      console.error("[Gemini API] GEMINI_API_KEY is not set in environment variables")
      console.error("[Gemini API] Available env vars:", Object.keys(process.env).filter(k => k.includes('GEMINI') || k.includes('GOOGLE')))
      return NextResponse.json(
        { success: false, error: "Gemini API key not configured. Please set GEMINI_API_KEY in your .env.local file and restart the server." },
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

    console.log("[Gemini API] Generated", questions.length, "interview questions")

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

