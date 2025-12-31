import { type NextRequest, NextResponse } from "next/server"
import type { CVData } from "@/lib/data"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

// JSON Schema for resume data
const RESUME_SCHEMA = {
  personalInfo: {
    name: "string",
    title: "string",
    location: "string",
    contact: {
      email: "string",
      phone: "string",
      linkedin: "string",
    },
  },
  experience: [
    {
      company: "string",
      role: "string",
      dates: "string",
      location: "string",
      rawDescription: "string",
      optimizedDescription: "string",
    },
  ],
  education: [
    {
      institution: "string",
      degree: "string",
      graduationDate: "string",
      details: "string",
    },
  ],
  skills: {
    technical: ["string"],
    soft: ["string"],
  },
  languages: ["string"],
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transcript } = body

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json(
        { success: false, error: "Transcript is required" },
        { status: 400 }
      )
    }

    console.log("[Gemini API] Processing transcript, length:", transcript.length)

    const prompt = `You are an expert resume writer specializing in ATS (Applicant Tracking System) optimization.

You have been given a voice conversation transcript between an AI agent and a user discussing the user's professional background. Your task is to extract and structure all relevant information into a complete, ATS-optimized resume.

CONVERSATION TRANSCRIPT:
${transcript}

INSTRUCTIONS:
1. Extract all personal information (name, title, location, contact details)
2. Extract all work experience with companies, roles, dates, locations, and descriptions
3. Extract all education information
4. Extract all skills (technical and soft skills)
5. Extract languages spoken
6. For job descriptions, enhance them with:
   - Strong action verbs (Implemented, Developed, Led, Optimized, etc.)
   - Quantified achievements where possible
   - ATS-friendly keywords
   - Professional, impactful language
7. Format dates consistently (e.g., "Jan 2020 – Present" or "2020-2023")
8. Ensure all fields are professional and complete

Return ONLY valid JSON matching this exact structure:
{
  "personalInfo": {
    "name": "",
    "title": "",
    "address": "",
    "city": "",
    "country": "",
    "phone": "",
    "email": "",
    "nationality": ""
  },
  "profile": "",
  "experience": [
    {
      "position": "",
      "company": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "description": []
    }
  ],
  "education": [
    {
      "degree": "",
      "institution": "",
      "location": "",
      "startDate": "",
      "endDate": ""
    }
  ],
  "references": [
    {
      "name": "",
      "email": "",
      "phone": ""
    }
  ],
  "skills": [
    {
      "label": "",
      "level": 0
    }
  ],
  "languages": [
    {
      "name": "",
      "proficiency": 0
    }
  ]
}

IMPORTANT: Return ONLY the JSON object, no additional text, no markdown formatting, no code blocks.`

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
          temperature: 0.3,
        }
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("[Gemini API] Error:", errorData)
      return NextResponse.json(
        { success: false, error: "Failed to process transcript" },
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

    console.log("[Gemini API] Received response, length:", text.length)

    // Parse JSON from response
    let parsedData: CVData
    try {
      // Remove markdown code blocks if present
      const cleanedText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim()

      parsedData = JSON.parse(cleanedText) as CVData

      // Validate structure
      if (!parsedData.personalInfo || !parsedData.experience || !parsedData.education) {
        throw new Error("Invalid CV data structure")
      }

      console.log("[Gemini API] Successfully parsed resume data")
    } catch (parseError) {
      console.error("[Gemini API] JSON parse error:", parseError)
      console.error("[Gemini API] Raw response:", text.substring(0, 500))
      return NextResponse.json(
        {
          success: false,
          error: "Failed to parse Gemini response as JSON",
          rawResponse: text.substring(0, 500),
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: parsedData,
    })
  } catch (error) {
    console.error("[Gemini API] Error processing transcript:", error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

