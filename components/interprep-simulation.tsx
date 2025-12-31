"use client"

import type React from "react"

import { useState } from "react"
import { ArrowLeft, Upload } from "lucide-react"
import InterviewSession from "./interview-session"
import type { InterviewContext } from "@/lib/interprep-service"

export default function InterPrepSimulation() {
  const [step, setStep] = useState<"context" | "session">("context")
  const [targetRole, setTargetRole] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [context, setContext] = useState<InterviewContext | null>(null)

  const handleStartSimulation = (e: React.FormEvent) => {
    e.preventDefault()
    if (targetRole.trim()) {
      const newContext: InterviewContext = {
        targetRole,
        jobDescription,
      }
      setContext(newContext)
      setStep("session")
    }
  }

  if (step === "session" && context) {
    return (
      <InterviewSession
        context={context}
        onBack={() => {
          setStep("context")
          setContext(null)
        }}
      />
    )
  }

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-8 max-w-2xl px-4">
      <div className="mb-4 w-full">
        <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
      </div>

      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-white">Simulation Context</h2>
        <p className="text-muted-foreground">InterPrep requires context to initiate the session.</p>
      </div>

      <form onSubmit={handleStartSimulation} className="w-full space-y-4">
        <div className="space-y-2 text-left">
          <label className="text-sm font-medium">Target Role</label>
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. Frontend Engineer"
            className="w-full px-4 py-3 bg-secondary text-foreground placeholder-muted-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-2 text-left">
          <label className="text-sm font-medium">Job Description</label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here..."
            className="w-full px-4 py-3 bg-secondary text-foreground placeholder-muted-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-32 resize-none"
          />
        </div>

        <button
          type="button"
          className="w-full px-4 py-3 border border-muted-foreground rounded-lg text-muted-foreground hover:text-foreground hover:border-foreground transition-colors flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload Your Resume Context (Optional)
        </button>

        <button
          type="submit"
          className="w-full px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-colors"
        >
          Enter Simulation
        </button>
      </form>
    </div>
  )
}
