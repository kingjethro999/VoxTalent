import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 }
      )
    }

    // Validate URL format
    let validUrl: URL
    try {
      validUrl = new URL(url)
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid URL format" },
        { status: 400 }
      )
    }

    console.log("[Parse Job Link] Fetching URL:", validUrl.toString())

    // Fetch the webpage
    const response = await fetch(validUrl.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch URL: ${response.statusText}` },
        { status: response.status }
      )
    }

    const html = await response.text()

    // Extract text content from HTML
    // Remove script and style tags
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ") // Remove HTML tags
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim()

    // Try to find job description sections
    // Common patterns: job description, requirements, qualifications, responsibilities
    const jobDescriptionPatterns = [
      /job\s*description[\s\S]{0,5000}/i,
      /about\s*the\s*role[\s\S]{0,5000}/i,
      /what\s*you['']ll\s*do[\s\S]{0,5000}/i,
      /responsibilities[\s\S]{0,5000}/i,
      /requirements[\s\S]{0,5000}/i,
      /qualifications[\s\S]{0,5000}/i,
    ]

    let extractedText = text

    // Try to extract relevant section
    for (const pattern of jobDescriptionPatterns) {
      const match = text.match(pattern)
      if (match && match[0].length > 200) {
        extractedText = match[0]
        break
      }
    }

    // If no specific section found, use a reasonable chunk (first 5000 chars)
    if (extractedText.length > 5000) {
      extractedText = extractedText.substring(0, 5000) + "..."
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return NextResponse.json(
        { success: false, error: "Could not extract meaningful job description from the URL" },
        { status: 400 }
      )
    }

    console.log("[Parse Job Link] Extracted text length:", extractedText.length)

    return NextResponse.json({
      success: true,
      text: extractedText.trim(),
      length: extractedText.length,
    })
  } catch (error) {
    console.error("[Parse Job Link] Error:", error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

