// Gemini API Service for ATS Optimization
// Transforms raw resume data into ATS-optimized format

import { generateText } from "ai"
import type { ResumeData } from "./types"

const GEMINI_MODEL = "google/gemini-2.5-flash"

export interface OptimizationResult {
  optimizedData: ResumeData
  improvements: string[]
}

export class GeminiAtsService {
  static async optimizeResumeData(rawData: Partial<ResumeData>): Promise<OptimizationResult> {
    try {
      const prompt = this.buildOptimizationPrompt(rawData)

      const { text } = await generateText({
        model: GEMINI_MODEL,
        prompt: prompt,
        temperature: 0.7,
      })

      // Parse the response to extract optimized data
      const optimizedData = this.parseOptimizedResponse(text, rawData)
      const improvements = this.extractImprovements(text)

      return {
        optimizedData,
        improvements,
      }
    } catch (error) {
      console.error("Error optimizing resume with Gemini:", error)
      throw error
    }
  }

  static async optimizeJobDescription(description: string): Promise<string> {
    try {
      const { text } = await generateText({
        model: GEMINI_MODEL,
        prompt: `You are an ATS (Applicant Tracking System) expert. Rewrite the following job description to emphasize action verbs, quantify achievements, and optimize phrasing for ATS compatibility. Keep the meaning intact but make it more impactful and ATS-friendly.

Job Description: "${description}"

Return only the optimized description without any additional text.`,
        temperature: 0.7,
      })

      return text.trim()
    } catch (error) {
      console.error("Error optimizing job description:", error)
      throw error
    }
  }

  private static buildOptimizationPrompt(data: Partial<ResumeData>): string {
    return `You are an expert resume writer specializing in ATS (Applicant Tracking System) optimization. 

Given the following raw resume information, enhance it for maximum ATS compatibility and impact:

Raw Data:
${JSON.stringify(data, null, 2)}

Please:
1. Enhance all job descriptions with strong action verbs (Implemented, Developed, Led, etc.)
2. Quantify achievements wherever possible (increased by 40%, reduced cost by $50k, etc.)
3. Optimize keywords for ATS while maintaining authenticity
4. Format all dates consistently (e.g., "Jan 2020 – Present")
5. Ensure all sections are professional and impactful

Return the optimized data in the following JSON format:
{
  "personalInfo": {
    "name": "",
    "title": "",
    "location": "",
    "contact": {
      "email": "",
      "phone": "",
      "linkedin": ""
    }
  },
  "experience": [
    {
      "company": "",
      "role": "",
      "dates": "",
      "location": "",
      "rawDescription": "",
      "optimizedDescription": ""
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "graduationDate": "",
      "details": ""
    }
  ],
  "skills": {
    "technical": [],
    "soft": []
  },
  "languages": []
}

Only return valid JSON, no additional text.`
  }

  private static parseOptimizedResponse(response: string, rawData: Partial<ResumeData>): ResumeData {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.warn("Could not parse JSON from Gemini response, using raw data")
        return (rawData as ResumeData) || this.getDefaultResumeData()
      }

      const parsed = JSON.parse(jsonMatch[0])
      return parsed as ResumeData
    } catch (error) {
      console.error("Error parsing Gemini response:", error)
      return (rawData as ResumeData) || this.getDefaultResumeData()
    }
  }

  private static extractImprovements(response: string): string[] {
    const improvements: string[] = []
    const lines = response.split("\n")

    for (const line of lines) {
      if (line.includes("enhanced") || line.includes("optimized") || line.includes("improved")) {
        improvements.push(line.trim())
      }
    }

    return improvements.slice(0, 5) // Return top 5 improvements
  }

  private static getDefaultResumeData(): ResumeData {
    return {
      personalInfo: {
        name: "",
        title: "",
        location: "",
        contact: {
          email: "",
          phone: "",
          linkedin: "",
        },
      },
      experience: [],
      education: [],
      skills: {
        technical: [],
        soft: [],
      },
      languages: [],
    }
  }
}
