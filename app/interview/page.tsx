"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download } from "lucide-react"
import ErrorState from "@/components/error-state"

export default function InterviewPage() {
  const router = useRouter()
  const [analysis, setAnalysis] = useState<string>("")
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const savedAnalysis = localStorage.getItem("voxTalent_interviewAnalysis")
    if (savedAnalysis) {
      setAnalysis(savedAnalysis)
    } else {
      setError(new Error("No interview analysis found. Please complete an interview first."))
    }
  }, [])

  const handleDownload = () => {
    if (!analysis) return

    const blob = new Blob([analysis], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `interview-analysis-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <nav className="fixed top-0 left-0 right-0 h-[70px] flex items-center justify-between px-10 z-50 bg-black/70 backdrop-blur-lg border-b border-white/5">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            VoxTalent
          </Link>
        </nav>
        <main className="pt-[90px] min-h-screen flex items-center justify-center px-4">
          <ErrorState
            title="No Analysis Found"
            message={error.message}
            onRetry={() => router.push("/")}
            retryLabel="Go Home"
          />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-[70px] flex items-center justify-between px-10 z-50 bg-black/70 backdrop-blur-lg border-b border-white/5">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>
        <div className="flex items-center gap-4">
          <Button
            onClick={handleDownload}
            className="bg-white text-black hover:bg-white/90"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Analysis
          </Button>
        </div>
      </nav>

      {/* Analysis Content */}
      <main className="pt-[90px] pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">Your Interview Analysis</h1>
            <p className="text-white/60">Based on your last interview session</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-8 md:p-12">
            <div className="prose prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-white/90">
                {analysis || "Loading analysis..."}
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

