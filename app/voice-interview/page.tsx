"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useElevenLabsWidget, type TranscriptEvent } from "@/hooks/use-elevenlabs-widget"
import { useTranscriptCollector } from "@/hooks/use-transcript-collector"
import { RESUME_BUDDY_AGENT } from "@/lib/elevenlabs-service"
import { updateResumeDataDeep } from "@/lib/old=data"
import ErrorState from "@/components/error-state"
import LoadingTransition from "@/components/loading-transition"
import { Button } from "@/components/ui/button"
import { Mic, MicOff } from "lucide-react"

type InterviewState = "idle" | "active" | "processing" | "error" | "complete"

export default function VoiceInterviewPage() {
  const router = useRouter()
  const [state, setState] = useState<InterviewState>("idle")
  const [error, setError] = useState<Error | null>(null)
  const [loadingStep, setLoadingStep] = useState(0)

  const { session, startSession, addTranscript, endSession, getFullTranscript, reset } =
    useTranscriptCollector()

  const { widgetRef, isInitialized, isCallActive, startCall, endCall } = useElevenLabsWidget({
    agentId: RESUME_BUDDY_AGENT.agentId,
    onTranscript: (event: TranscriptEvent) => {
      console.log("[Voice Interview] Transcript received:", event.text.substring(0, 50))
      addTranscript(event)

      // Detect end of conversation - check if agent asks closing question
      const transcriptText = event.text.toLowerCase()
      if (
        event.role === "assistant" &&
        (transcriptText.includes("anything else") ||
          transcriptText.includes("that's all") ||
          transcriptText.includes("complete") ||
          transcriptText.includes("anything more"))
      ) {
        // Set a flag to check for user confirmation
        setTimeout(() => {
          const currentSession = getFullTranscript()
          const lowerTranscript = currentSession.toLowerCase()
          
          // Check if user confirmed completion
          if (
            lowerTranscript.includes("no, that's all") ||
            lowerTranscript.includes("no that's all") ||
            lowerTranscript.includes("nothing else") ||
            lowerTranscript.includes("that's everything") ||
            lowerTranscript.includes("no, nothing else")
          ) {
            handleEndConversation()
          }
        }, 3000)
      }
    },
    onCallStart: () => {
      console.log("[Voice Interview] Call started")
      setState("active")
      startSession()
    },
    onCallEnd: () => {
      console.log("[Voice Interview] Call ended")
      endSession()
      if (state === "active") {
        handleEndConversation()
      }
    },
    onError: (err) => {
      console.error("[Voice Interview] Error:", err)
      setError(err)
      setState("error")
    },
  })

  const handleStartInterview = () => {
    console.log("[Voice Interview] Start button clicked")
    console.log("[Voice Interview] Widget initialized:", isInitialized)
    console.log("[Voice Interview] Widget ref:", widgetRef.current)
    
    if (!isInitialized) {
      console.warn("[Voice Interview] Widget not initialized yet, waiting...")
      // Wait a bit and try again
      setTimeout(() => {
        if (isInitialized) {
          startCall()
        } else {
          setError(new Error("Widget failed to initialize. Please refresh the page and try again."))
          setState("error")
        }
      }, 2000)
      return
    }

    try {
      console.log("[Voice Interview] Calling startCall()")
      startCall()
    } catch (err) {
      console.error("[Voice Interview] Error starting call:", err)
      setError(err as Error)
      setState("error")
    }
  }

  const handleEndConversation = async () => {
    console.log("[Voice Interview] Ending conversation and processing transcript")
    setState("processing")
    endCall()
    endSession()

    // Process transcript with Gemini
    try {
      const transcript = getFullTranscript()
      console.log("[Voice Interview] Sending transcript to Gemini, length:", transcript.length)

      setLoadingStep(0)
      const response = await fetch("/api/gemini/process-transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to process transcript")
      }

      setLoadingStep(1)
      const result = await response.json()

      if (!result.success || !result.data) {
        throw new Error("Invalid response from Gemini API")
      }

      console.log("[Voice Interview] Received structured data from Gemini")
      setLoadingStep(2)

      // Update data.tsx with Gemini output
      updateResumeDataDeep(result.data)

      // Navigate to template selection
      setTimeout(() => {
        router.push("/cv-select")
      }, 1000)
    } catch (err) {
      console.error("[Voice Interview] Error processing transcript:", err)
      setError(err as Error)
      setState("error")
    }
  }

  const handleRetry = () => {
    setError(null)
    setState("idle")
    reset()
  }

  // Mask widget UI with CSS
  useEffect(() => {
    const style = document.createElement("style")
    style.textContent = `
      /* Hide ElevenLabs widget default UI */
      [data-elevenlabs-widget] button[aria-label*="Start"],
      [data-elevenlabs-widget] button[aria-label*="End"],
      [data-elevenlabs-widget] button[aria-label*="Stop"],
      [data-elevenlabs-widget] .widget-header,
      [data-elevenlabs-widget] .widget-branding,
      [data-elevenlabs-widget] .elevenlabs-branding {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        width: 0 !important;
        overflow: hidden !important;
      }
      
      /* Keep only the voice layer active */
      [data-elevenlabs-widget] {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
        pointer-events: none;
      }
      
      [data-elevenlabs-widget] audio,
      [data-elevenlabs-widget] canvas {
        pointer-events: auto;
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Hidden ElevenLabs Widget */}
      <div 
        ref={widgetRef} 
        className="fixed inset-0 z-0"
        data-elevenlabs-agent-id={RESUME_BUDDY_AGENT.agentId}
        data-elevenlabs-widget="true"
      />

      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-[70px] flex items-center justify-between px-10 z-50 bg-black/70 backdrop-blur-lg border-b border-white/5">
        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          VoxTalent
        </Link>
        <Link href="/credits" className="text-sm font-semibold text-white/60 hover:text-white transition-colors">
          Credits
        </Link>
      </nav>

      {/* Main Content */}
      <main className="pt-[90px] min-h-screen flex flex-col items-center justify-center px-4 relative z-10">
        {state === "idle" && (
          <div className="flex flex-col items-center gap-8 max-w-2xl text-center">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
              Let's Build Your Resume
            </h1>
            <p className="text-lg text-white/60">
              I'll ask you a few questions about your experience, and we'll create a professional, ATS-optimized resume together.
            </p>
            <Button
              onClick={handleStartInterview}
              disabled={!isInitialized}
              size="lg"
              className="px-8 py-6 text-lg font-semibold bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mic className="mr-2 h-5 w-5" />
              {isInitialized ? "Get Started" : "Initializing Widget..."}
            </Button>
            {!isInitialized && (
              <p className="text-sm text-white/40 mt-2">
                Loading voice interface... This may take a few seconds.
              </p>
            )}
          </div>
        )}

        {state === "active" && (
          <div className="flex flex-col items-center gap-6 max-w-2xl text-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center">
                <Mic className="h-12 w-12 text-green-400 animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-green-500/30 animate-ping" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-2">Interview in Progress</h2>
              <p className="text-white/60">
                Speak naturally. I'm listening and will guide you through the process.
              </p>
            </div>
            <Button
              onClick={handleEndConversation}
              variant="outline"
              size="lg"
              className="mt-4"
            >
              <MicOff className="mr-2 h-4 w-4" />
              End Interview
            </Button>
          </div>
        )}

        {state === "processing" && (
          <div className="w-full max-w-2xl">
            <LoadingTransition
              messages={["Compiling your resume", "Optimizing for ATS", "Preparing preview"]}
              currentStep={loadingStep}
            />
          </div>
        )}

        {state === "error" && error && (
          <ErrorState
            title="Interview Error"
            message={error.message || "An error occurred during the interview. Please try again."}
            onRetry={handleRetry}
            retryLabel="Start Over"
          />
        )}
      </main>
    </div>
  )
}

