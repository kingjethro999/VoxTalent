"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useElevenLabsWidgetEmbed, type TranscriptEvent } from "@/hooks/use-elevenlabs-widget-embed"
import { useTranscriptCollector } from "@/hooks/use-transcript-collector"
import ErrorState from "@/components/error-state"
import LoadingTransition from "@/components/loading-transition"
import { Button } from "@/components/ui/button"
import { Mic, MicOff } from "lucide-react"
import { updateCvData } from "@/lib/data"

const RESUME_BUDDY_AGENT_ID = "agent_3101kdqdvxzse409wmgmbrk97fg6"
const INTERPREP_AGENT_ID = "agent_5901kdqx7sv0ef5sw5txaegdy9jv"

type InterviewState = "idle" | "active" | "processing" | "error"

export default function AIPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const mode = searchParams.get("mode") || "resumebuddy"
  const targetRole = searchParams.get("targetRole") || ""
  const jobDescription = searchParams.get("jobDescription") || ""

  const [state, setState] = useState<InterviewState>("idle")
  const [error, setError] = useState<Error | null>(null)
  const [loadingStep, setLoadingStep] = useState(0)
  const [isPulsating, setIsPulsating] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)

  const agentId = mode === "resumebuddy" ? RESUME_BUDDY_AGENT_ID : INTERPREP_AGENT_ID
  const widgetContainerRef = useRef<HTMLDivElement | null>(null)

  const { session, startSession, addTranscript, endSession, getFullTranscript, reset } =
    useTranscriptCollector()

  const { widgetRef, isInitialized, isCallActive, startCall, endCall, getFullTranscript: getWidgetTranscript } =
    useElevenLabsWidgetEmbed({
      agentId,
      onTranscript: (event: TranscriptEvent) => {
        console.log("[AI Page] Transcript received:", event.text.substring(0, 50))
        addTranscript(event)
        setIsPulsating(true)

        // Detect closing remarks
        const text = event.text.toLowerCase()
        const closingPhrases = [
          "anything else",
          "that's all",
          "complete",
          "anything more",
          "anything additional",
          "we're done",
          "that's everything",
        ]

        if (event.role === "assistant" && closingPhrases.some((phrase) => text.includes(phrase))) {
          // Wait for user response
          setTimeout(() => {
            const fullTranscript = getFullTranscript().toLowerCase()
            if (
              fullTranscript.includes("no, that's all") ||
              fullTranscript.includes("no that's all") ||
              fullTranscript.includes("nothing else") ||
              fullTranscript.includes("that's everything") ||
              fullTranscript.includes("no, nothing else") ||
              fullTranscript.includes("no thank you") ||
              fullTranscript.includes("that's it")
            ) {
              handleEndConversation()
            }
          }, 3000)
        }
      },
      onCallStart: () => {
        console.log("[AI Page] Call started")
        setState("active")
        setIsPulsating(true)
        startSession()
        // Try to extract conversation_id from widget
        setTimeout(() => {
          if (widgetRef.current) {
            const widgetEl = widgetRef.current as any
            // Try to get conversation_id from widget attributes or data
            const convId = widgetEl.getAttribute?.("conversation-id") || 
                          widgetEl.conversationId ||
                          widgetEl.dataset?.conversationId
            if (convId) {
              console.log("[AI Page] Conversation ID:", convId)
              setConversationId(convId)
            }
          }
        }, 1000)
      },
      onCallEnd: () => {
        console.log("[AI Page] Call ended")
        setIsPulsating(false)
        endSession()
        if (state === "active") {
          // Wait for webhook instead of using live transcript
          handleEndConversationWithWebhook()
        }
      },
      onError: (err) => {
        console.error("[AI Page] Error:", err)
        setError(err)
        setState("error")
      },
    })

  const handleStartInterview = () => {
    console.log("[AI Page] Start button clicked")
    if (!isInitialized) {
      console.warn("[AI Page] Widget not initialized yet")
      return
    }
    try {
      startCall()
    } catch (err) {
      console.error("[AI Page] Error starting call:", err)
      setError(err as Error)
      setState("error")
    }
  }

  // Wait for webhook and process transcript
  const handleEndConversationWithWebhook = async () => {
    console.log("[AI Page] Call ended, waiting for webhook...")
    setState("processing")
    setIsPulsating(false)
    endCall()
    endSession()

    setLoadingStep(0)

    const callStartTime = Date.now()

    // Poll for webhook data by agent_id (webhook should arrive within a few seconds)
    const pollForWebhook = async (): Promise<string | null> => {
      const maxAttempts = 30 // Poll for up to 30 seconds
      let attempts = 0

      while (attempts < maxAttempts) {
        try {
          // Poll for latest transcript for this agent since call started
          const response = await fetch(`/api/get-transcript-by-agent/${agentId}?since=${callStartTime}`)
          const data = await response.json()

          if (data.found && data.transcript) {
            console.log("[AI Page] Webhook transcript received, length:", data.transcript.length)
            if (data.conversationId) {
              setConversationId(data.conversationId)
            }
            return data.transcript
          }

          // Wait 1 second before next attempt
          await new Promise((resolve) => setTimeout(resolve, 1000))
          attempts++
        } catch (err) {
          console.error("[AI Page] Error polling for webhook:", err)
          attempts++
        }
      }

      // Fallback to live transcript if webhook doesn't arrive
      console.warn("[AI Page] Webhook not received, using live transcript")
      return getFullTranscript()
    }

    try {
      // Step 0: Calibrating data (collecting transcript)
      console.log("[AI Page] Step 0: Calibrating data...")
      setLoadingStep(0)
      
      const transcript = await pollForWebhook()
      if (!transcript) {
        throw new Error("No transcript available")
      }

      console.log("[AI Page] Transcript collected, length:", transcript.length)
      
      // Step 1: Structuring resume (sending to Gemini)
      console.log("[AI Page] Step 1: Structuring resume...")
      setLoadingStep(1)

      const endpoint = mode === "resumebuddy" ? "/api/gemini/process-transcript" : "/api/gemini/process-interview"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript,
          ...(mode === "interprep" && { targetRole, jobDescription }),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to process transcript")
      }

      // Step 2: Optimizing ATS (processing Gemini response)
      console.log("[AI Page] Step 2: Optimizing ATS...")
      setLoadingStep(2)
      
      const result = await response.json()

      if (!result.success) {
        throw new Error("Invalid response from Gemini API")
      }

      console.log("[AI Page] Received data from Gemini")

      if (mode === "resumebuddy") {
        // Update CV data (this happens during step 2)
        if (result.data) {
          updateCvData(result.data)
          console.log("[AI Page] CV data updated in data.tsx")
        }

        // Step 3: Preparing preview (navigate to template selection)
        console.log("[AI Page] Step 3: Preparing preview...")
        setLoadingStep(3)

        // Navigate to template selection
        setTimeout(() => {
          router.push("/cv-select")
        }, 1500)
      } else {
        // InterPrep: Store analysis and navigate to interview page
        if (result.analysis) {
          localStorage.setItem("voxTalent_interviewAnalysis", result.analysis)
        }

        setLoadingStep(2)
        setTimeout(() => {
          router.push("/interview")
        }, 1500)
      }
    } catch (err) {
      console.error("[AI Page] Error processing transcript:", err)
      setError(err as Error)
      setState("error")
    }
  }

  // Fallback handler for manual end
  const handleEndConversation = () => {
    handleEndConversationWithWebhook()
  }

  const handleRetry = () => {
    setError(null)
    setState("idle")
    reset()
  }

  // Create widget element and set ref
  useEffect(() => {
    if (!widgetContainerRef.current || !isInitialized) return

    // Check if widget already exists
    const existingWidget = widgetContainerRef.current.querySelector("elevenlabs-convai")
    if (existingWidget) {
      console.log("[AI Page] Widget already exists, reusing")
      widgetRef.current = existingWidget as any
      // Update agent-id if it changed
      if (existingWidget.getAttribute("agent-id") !== agentId) {
        existingWidget.setAttribute("agent-id", agentId)
      }
      return
    }

    // Wait a bit to ensure custom element is registered
    const createWidget = () => {
      try {
        // Create the custom element
        const widgetEl = document.createElement("elevenlabs-convai")
        widgetEl.setAttribute("agent-id", agentId)
        widgetContainerRef.current!.appendChild(widgetEl)
        
        // Set the ref for the hook
        widgetRef.current = widgetEl as any
        console.log("[AI Page] Widget element created")
      } catch (error) {
        console.error("[AI Page] Error creating widget element:", error)
        // Retry after a short delay
        setTimeout(createWidget, 500)
      }
    }

    // Small delay to ensure custom element is registered
    setTimeout(createWidget, 100)

    return () => {
      // Don't remove widget on cleanup to avoid re-registration errors
    }
  }, [isInitialized, agentId, widgetRef])


  return (
    <>
      <div className="min-h-screen bg-black text-white relative">
        {/* ElevenLabs Widget Container */}
        <div ref={widgetContainerRef} className="fixed inset-0 z-[100]" />

        {/* Top Navigation */}
        <nav className="fixed top-0 left-0 right-0 h-[70px] flex items-center justify-between px-10 z-[200] bg-black/70 backdrop-blur-lg border-b border-white/5 pointer-events-auto">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            VoxTalent
          </Link>
          <Link href="/credits" className="text-sm font-semibold text-white/60 hover:text-white transition-colors">
              Credits
            </Link>
        </nav>

        {/* Main Content */}
        <main className="pt-[90px] min-h-screen flex flex-col items-center justify-center px-4 relative z-[150] pointer-events-none">
          {state === "idle" && (
            <div className="flex flex-col items-center gap-8 max-w-2xl text-center pointer-events-auto">
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
                {mode === "resumebuddy" ? "Let's Build Your Resume" : "Interview Practice"}
              </h1>
              <p className="text-lg text-white/60">
                {mode === "resumebuddy"
                  ? "I'll ask you a few questions about your experience, and we'll create a professional, ATS-optimized resume together."
                  : "Let's practice your interview. I'll ask you questions based on the role you're applying for."}
              </p>
              {!isInitialized && (
                <p className="text-sm text-white/40 mt-2">
                  Loading voice interface... This may take a few seconds.
                </p>
              )}
            </div>
          )}

          {state === "active" && (
            <div className="flex flex-col items-center gap-6 max-w-2xl text-center pointer-events-auto">
              <div className={`relative ${isPulsating ? "animate-pulse" : ""}`}>
                <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Mic className="h-12 w-12 text-green-400" />
                </div>
                {isPulsating && (
                  <div className="absolute inset-0 rounded-full border-4 border-green-500/30 animate-ping" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-2">Interview in Progress</h2>
                <p className="text-white/60">
                  Speak naturally. I'm listening and will guide you through the process.
                </p>
              </div>
              <Button onClick={handleEndConversation} variant="outline" size="lg" className="mt-4">
                <MicOff className="mr-2 h-4 w-4" />
                End Interview
              </Button>
            </div>
          )}

          {state === "processing" && (
            <div className="w-full max-w-2xl pointer-events-auto">
              <LoadingTransition
                messages={
                  mode === "resumebuddy"
                    ? ["Calibrating data", "Structuring resume", "Optimizing ATS", "Preparing preview"]
                    : ["Analyzing your interview", "Generating feedback", "Preparing your report"]
                }
                currentStep={loadingStep}
              />
            </div>
          )}

          {state === "error" && error && (
            <div className="pointer-events-auto">
            <ErrorState
              title="Interview Error"
              message={error.message || "An error occurred during the interview. Please try again."}
              onRetry={handleRetry}
              retryLabel="Start Over"
            />
            </div>
          )}
        </main>
      </div>
    </>
  )
}
