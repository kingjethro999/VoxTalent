import { type NextRequest, NextResponse } from "next/server"
import mammoth from "mammoth"

// Type declaration for pdf-parse CommonJS module
declare function require(module: string): any

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      )
    }

    const fileType = file.type
    const fileName = file.name.toLowerCase()

    let text = ""

    // Handle PDF files
    if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
      try {
        // Use require for CommonJS module compatibility
        const pdfParse = require("pdf-parse")
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const pdfData = await pdfParse(buffer)
        text = pdfData.text
        console.log("[Parse Resume] PDF parsed, length:", text.length)
      } catch (error) {
        console.error("[Parse Resume] PDF parsing error:", error)
        return NextResponse.json(
          { success: false, error: "Failed to parse PDF file" },
          { status: 500 }
        )
      }
    }
    // Handle DOCX files
    else if (
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileName.endsWith(".docx")
    ) {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const result = await mammoth.extractRawText({ buffer })
        text = result.value
        console.log("[Parse Resume] DOCX parsed, length:", text.length)
      } catch (error) {
        console.error("[Parse Resume] DOCX parsing error:", error)
        return NextResponse.json(
          { success: false, error: "Failed to parse DOCX file" },
          { status: 500 }
        )
      }
    }
    // Handle TXT files
    else if (fileType === "text/plain" || fileName.endsWith(".txt")) {
      text = await file.text()
      console.log("[Parse Resume] TXT parsed, length:", text.length)
    }
    // Unsupported file type
    else {
      return NextResponse.json(
        { success: false, error: "Unsupported file type. Please upload .txt, .pdf, or .docx files" },
        { status: 400 }
      )
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "File appears to be empty or could not extract text" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      text: text,
      length: text.length,
    })
  } catch (error) {
    console.error("[Parse Resume] Error:", error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

