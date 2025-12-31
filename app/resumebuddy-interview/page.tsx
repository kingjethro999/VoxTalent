"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Mic, Pause } from "lucide-react"
import ErrorState from "@/components/error-state"
import LoadingTransition from "@/components/loading-transition"
import { updateCvData } from "@/lib/data"

interface Question {
  question: string
  category: string
  order: number
}

type InterviewState = "loading" | "generating" | "ready" | "asking" | "listening" | "processing" | "complete" | "error"

export default function ResumeBuddyInterviewPage() {
  const router = useRouter()
  const [state, setState] = useState<InterviewState>("loading")
  const [error, setError] = useState<Error | null>(null)
  const [loadingStep, setLoadingStep] = useState(0)
  
  // Data
  const [questions, setQuestions] = useState<Question[]>([])
  
  // Interview state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [conversationHistory, setConversationHistory] = useState<Array<{ question: string; answer: string }>>([])
  
  // Answer State (Immediate and accumulated)
  const [currentAnswer, setCurrentAnswer] = useState("")
  
  // Audio & Recognition Refs
  const [isPlaying, setIsPlaying] = useState(false)
  const [isListening, setIsListening] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recognitionRef = useRef<any>(null)
  const isSubmittingRef = useRef(false) // Prevents double submissions
  const currentAnswerRef = useRef("") // Ref to access latest answer in callbacks
  const isRequestingRef = useRef<boolean>(false) // Guard against multiple simultaneous TTS requests

  // Generate questions on mount
  useEffect(() => {
    generateQuestions()
  }, [])

  // ----------------------------------------------------------------------
  // CORE FIX: Silence Detection using useEffect
  // This replaces the manual "checkTextUpdate" loop that was getting stuck.
  // ----------------------------------------------------------------------
  useEffect(() => {
    // Only run if we are actively listening and have some text
    if (!isListening || currentAnswer.trim().length === 0) return

    // Set a timer to submit after 3 seconds of no text updates
    const timer = setTimeout(() => {
      console.log("[ResumeBuddy] Silence detected (3s). Auto-submitting...")
      submitAnswer()
    }, 3000)

    // Cleanup: If 'currentAnswer' changes (user speaks), this clears the old timer
    // and starts a fresh 3s timer.
    return () => clearTimeout(timer)
  }, [currentAnswer, isListening])


  const generateQuestions = async () => {
    setState("generating")
    try {
      // NOTE: Ensure this matches your actual API route path
      const response = await fetch("/api/gemini/generate-resume-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Failed to generate questions")
      }

      setQuestions(result.questions)
      setState("ready")
    } catch (err) {
      console.error("Error generating questions:", err)
      setError(err as Error)
      setState("error")
    }
  }

  const askQuestion = async (question: Question) => {
    // Prevent multiple simultaneous requests
    if (isRequestingRef.current) {
      console.log("[ResumeBuddy] TTS request already in progress, skipping")
      return
    }

    setState("asking")
    setIsListening(false)
    setCurrentAnswer("")
    currentAnswerRef.current = ""
    isSubmittingRef.current = false

    // Cleanup previous audio/recognition
    if (audioRef.current) audioRef.current.pause()
    if (recognitionRef.current) recognitionRef.current.stop()

    isRequestingRef.current = true

    try {
      const response = await fetch("/api/elevenlabs/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: question.question }),
      })

      const result = await response.json()
      if (!result.success) {
        // Don't retry on API errors - just proceed to listening
        console.error("[ResumeBuddy] TTS API error:", result.error)
        isRequestingRef.current = false
        startListening()
        return
      }

      const audio = new Audio(`data:audio/mp3;base64,${result.audio}`)
      audioRef.current = audio
      
      audio.onplay = () => setIsPlaying(true)
      audio.onended = () => {
        setIsPlaying(false)
        isRequestingRef.current = false
        // Give a small breathing room before listening
        setTimeout(() => startListening(), 500)
      }
      
      // Fallback if audio fails to play
      audio.onerror = () => {
        console.warn("Audio playback failed, starting listening anyway")
        setIsPlaying(false)
        isRequestingRef.current = false
        startListening()
      }
      
      await audio.play()
    } catch (err) {
      console.error("Error asking question:", err)
      isRequestingRef.current = false
      // If TTS fails, just move to listening state so user can still answer
      startListening() 
    }
  }

  const startListening = useCallback(async () => {
    if (recognitionRef.current) recognitionRef.current.stop()

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) {
      alert("Speech recognition not supported. Please use Chrome.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onstart = () => {
      setIsListening(true)
      setState("listening")
    }

    recognition.onresult = (event: any) => {
      let finalTranscript = ""
      let interimTranscript = ""

      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " "
        } else {
          interimTranscript += transcript
        }
      }

      // Combine what we had before (if needed) with new input
      // Ideally, for continuous=true, we just take the full event stream
      // But to be safe, we just use what the event gives us cleanly
      
      const fullText = (finalTranscript + interimTranscript).replace(/\s+/g, ' ')
      
      // Update state (triggers the useEffect timer)
      if (fullText.trim()) {
        setCurrentAnswer(prev => {
            // Simple logic: if the new text is longer or different, update
            // For simple "continuous" usage, usually accumulating is safer
            // but here we just want the latest snapshot.
            return fullText
        })
        currentAnswerRef.current = fullText
      }
    }

    recognition.onend = () => {
        // FAILSAFE: If recognition stops...
        if (isSubmittingRef.current) return // We stopped it intentionally

        // If we have an answer, assume the user finished speaking and the browser cut it off
        if (currentAnswerRef.current.trim().length > 0) {
            console.log("[ResumeBuddy] Recognition ended with text. Submitting.")
            submitAnswer()
        } else {
            // No text? Probably noise or permissions. Restart listening.
            if (state === "listening") {
                console.log("[ResumeBuddy] Recognition restarted (empty input)")
                try {
                    recognition.start()
                } catch (e) { /* ignore start errors */ }
            }
        }
    }

    recognition.onerror = (event: any) => {
      console.error("Speech error:", event.error)
      
      if (event.error === 'network') {
        // Option A: Auto-retry after a short delay (e.g. 1 second)
        setTimeout(() => {
           try {
             if (state === 'listening') recognition.start();
           } catch(e) {}
        }, 1000);
        
        // Option B: Show a user-friendly toast/alert
        // toast.error("Network issue detected. Please check your internet connection.");
      } else if (event.error === 'not-allowed') {
        setIsListening(false)
        alert("Microphone access denied.")
      }
    }

    recognitionRef.current = recognition
    try {
        recognition.start()
    } catch(e) {
        console.error("Failed to start recognition", e)
    }
  }, [state]) // Depend on state to know if we should restart

  const submitAnswer = async () => {
    // Prevent double submission
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true

    // Stop listening immediately
    if (recognitionRef.current) {
        recognitionRef.current.stop() 
    }
    setIsListening(false)

    // Capture the answer
    const answerToSubmit = currentAnswerRef.current.trim()
    if (!answerToSubmit) {
        // If empty, just restart listening (user was silent too long)
        isSubmittingRef.current = false
        startListening()
        return
    }

    console.log("Submitting:", answerToSubmit)

    // Update History
    const currentQ = questions[currentQuestionIndex]
    const newHistory = [...conversationHistory, {
        question: currentQ.question,
        answer: answerToSubmit
    }]
    setConversationHistory(newHistory)

    // Proceed
    if (currentQuestionIndex < questions.length - 1) {
        const nextIndex = currentQuestionIndex + 1
        setCurrentQuestionIndex(nextIndex)
        // Small delay to let UI settle
        setTimeout(() => {
            askQuestion(questions[nextIndex])
        }, 500)
    } else {
        processTranscript(newHistory)
    }
  }

  const processTranscript = async (history: typeof conversationHistory) => {
    setState("processing")
    setLoadingStep(0)

    try {
      const transcript = history.map(item => `Q: ${item.question}\nA: ${item.answer}`).join("\n\n")
      
      setLoadingStep(1) // Structuring
      const response = await fetch("/api/gemini/process-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      })

      if (!response.ok) throw new Error("Failed to process transcript")
      const result = await response.json()

      setLoadingStep(2) // Optimizing
      if (result.data) {
        updateCvData(result.data)
      }

      setLoadingStep(3) // Preview
      setTimeout(() => router.push("/cv-select"), 1500)
    } catch (err) {
      console.error(err)
      setError(err as Error)
      setState("error")
    }
  }

  // --- RENDER HELPERS ---

  if (state === "error" && error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <ErrorState title="Error" message={error.message} onRetry={() => window.location.reload()} />
      </div>
    )
  }

  if (["loading", "generating", "processing"].includes(state)) {
    return (
      <div className="min-h-screen bg-black text-white pt-[90px] flex justify-center">
        <LoadingTransition messages={["Preparing...", "Analyzing...", "Finalizing..."]} currentStep={loadingStep} />
      </div>
    )
  }

  if (state === "ready" && currentQuestionIndex === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">Ready to Start</h1>
        <button 
            onClick={() => askQuestion(questions[0])}
            className="px-8 py-4 bg-white text-black rounded-lg font-bold hover:bg-gray-200"
        >
            Start Interview
        </button>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="fixed top-0 left-0 right-0 h-[70px] flex items-center justify-between px-10 z-50 bg-black/70 backdrop-blur-lg border-b border-white/5">
        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          VoxTalent
        </Link>
        <div className="text-sm text-white/60">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
      </nav>

      <main className="pt-[90px] min-h-screen flex flex-col items-center justify-center px-4">
        {/* Progress Bar */}
        <div className="w-full max-w-2xl mb-8">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-lg p-8 mb-8">
          <div className="mb-4">
            <span className="text-xs uppercase tracking-wider text-white/40">
              {currentQuestion?.category}
            </span>
          </div>
          <h2 className="text-2xl font-semibold mb-6">{currentQuestion?.question}</h2>

          {/* Status Indicator */}
          {state === "asking" && (
             <div className="flex items-center gap-2 text-yellow-400 mb-4">
               <Pause className="h-4 w-4" /> <span>Asking...</span>
             </div>
          )}
          {state === "listening" && (
            <div className="flex items-center gap-2 text-green-400 mb-4">
                <Mic className="h-4 w-4 animate-pulse" /> 
                <span>Listening... (Auto-submits after 3s silence)</span>
            </div>
          )}

          {/* Answer Display */}
          <div className="w-full p-4 bg-white/5 border border-white/10 rounded-lg text-white min-h-[150px]">
            {currentAnswer ? (
                <p className="whitespace-pre-wrap">{currentAnswer}</p>
            ) : (
                <p className="text-white/30 italic">
                    {state === "asking" ? "Listen to the question..." : "Speak your answer..."}
                </p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}