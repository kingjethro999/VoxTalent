"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { useState, useRef } from "react"
import { Upload } from "lucide-react"

export default function InterPrepHome() {
  const router = useRouter()
  const [targetRole, setTargetRole] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [resume, setResume] = useState<string>("")
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setResumeFile(file)
    setIsParsing(true)

    try {
      const fileType = file.type
      const fileName = file.name.toLowerCase()

      // Handle TXT files directly in browser
      if (fileType === "text/plain" || fileName.endsWith(".txt")) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const text = event.target?.result as string
          setResume(text)
          setIsParsing(false)
        }
        reader.onerror = () => {
          console.error("Error reading file")
          setIsParsing(false)
        }
        reader.readAsText(file)
      }
      // Handle PDF and DOCX files via API
      else if (
        fileType === "application/pdf" ||
        fileName.endsWith(".pdf") ||
        fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        fileName.endsWith(".docx")
      ) {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/parse-resume", {
          method: "POST",
          body: formData,
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || "Failed to parse file")
        }

        setResume(result.text)
        setIsParsing(false)
      } else {
        throw new Error("Unsupported file type. Please upload .txt, .pdf, or .docx files")
      }
    } catch (error) {
      console.error("Error parsing file:", error)
      alert(error instanceof Error ? error.message : "Failed to parse file")
      setResumeFile(null)
      setResume("")
      setIsParsing(false)
    }
  }

  const handleStartSimulation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetRole.trim() || !resume.trim() || !jobDescription.trim()) return

    setIsSubmitting(true)

    try {
      // Store data in localStorage for the interview page
      localStorage.setItem("voxTalent_interprep_resume", resume)
      localStorage.setItem("voxTalent_interprep_jobTitle", targetRole)
      localStorage.setItem("voxTalent_interprep_jobDescription", jobDescription)

      // Navigate to new InterPrep interview page
      router.push("/interprep-interview")
    } catch (error) {
      console.error("Failed to navigate to interview:", error)
      setIsSubmitting(false)
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        textAlign: "center",
        gap: "40px",
        width: "100%",
        minHeight: "100%",
        padding: "20px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h1
          style={{
            fontSize: "clamp(3rem, 8vw, 5.5rem)",
            fontWeight: 800,
            margin: 0,
            background: "linear-gradient(to bottom, #fff, #666)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          InterPrep
        </h1>
        <p style={{ fontSize: "1.1rem", color: "rgba(255, 255, 255, 0.5)", margin: 0 }}>
          Master your interview with high-stakes simulation. Get brutally honest AI feedback.
        </p>
      </div>

      <form
        onSubmit={handleStartSimulation}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          width: "100%",
          maxWidth: "400px",
          background: "rgba(21, 21, 24, 0.6)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          borderRadius: "20px",
          padding: "32px",
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgba(255, 255, 255, 0.7)" }}>Target Role</label>
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. Frontend Engineer"
            style={{
              marginTop: "8px",
              padding: "12px 16px",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "white",
              fontSize: "0.9rem",
              fontFamily: "Inter, sans-serif",
              width: "100%",
              boxSizing: "border-box",
              transition: "all 0.3s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#8E75FF"
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)"
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"
            }}
            required
          />
        </div>

        <div style={{ textAlign: "left" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgba(255, 255, 255, 0.7)" }}>
            Resume (Upload .txt, .pdf, or .docx file)
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              marginTop: "8px",
              padding: "12px 16px",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#8E75FF"
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)"
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"
            }}
          >
            <Upload className="h-4 w-4" />
            <span style={{ fontSize: "0.9rem", color: resumeFile ? "white" : "rgba(255, 255, 255, 0.5)" }}>
              {isParsing ? "Parsing file..." : resumeFile ? resumeFile.name : "Click to upload resume (.txt, .pdf, .docx)"}
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.docx"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          {resume && (
            <p style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.5)", marginTop: "4px" }}>
              Resume loaded ({resume.length} characters)
            </p>
          )}
        </div>

        <div style={{ textAlign: "left" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgba(255, 255, 255, 0.7)" }}>
            Job Description
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here..."
            style={{
              marginTop: "8px",
              padding: "12px 16px",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "white",
              fontSize: "0.9rem",
              fontFamily: "Inter, sans-serif",
              width: "100%",
              boxSizing: "border-box",
              minHeight: "100px",
              resize: "none",
              transition: "all 0.3s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#8E75FF"
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)"
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !targetRole.trim() || !resume.trim() || !jobDescription.trim()}
          style={{
            marginTop: "16px",
            padding: "14px 32px",
            borderRadius: "50px",
            background: (targetRole.trim() && resume.trim() && jobDescription.trim()) ? "#fff" : "rgba(255, 255, 255, 0.3)",
            color: (targetRole.trim() && resume.trim() && jobDescription.trim()) ? "#000" : "rgba(255, 255, 255, 0.5)",
            fontWeight: 700,
            fontSize: "0.95rem",
            border: "none",
            cursor: (targetRole.trim() && resume.trim() && jobDescription.trim()) ? "pointer" : "not-allowed",
            transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            fontFamily: "Inter, sans-serif",
            opacity: isSubmitting ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (targetRole.trim() && resume.trim() && jobDescription.trim()) {
              e.currentTarget.style.transform = "scale(1.05)"
              e.currentTarget.style.boxShadow = "0 0 30px rgba(255, 255, 255, 0.15)"
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)"
            e.currentTarget.style.boxShadow = "none"
          }}
        >
          {isSubmitting ? "Starting..." : "Enter Simulation"}
        </button>
      </form>
    </div>
  )
}
