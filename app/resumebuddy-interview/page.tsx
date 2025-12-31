"use client"

import { useState, useEffect, useRef } from "react"
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
  const [currentAnswer, setCurrentAnswer] = useState("")
  
  // Audio
  const [isPlaying, setIsPlaying] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const currentAnswerRef = useRef<string>("")

  // Generate questions on mount
  useEffect(() => {
    generateQuestions()
  }, [])

  const generateQuestions = async () => {
    setState("generating")
    try {
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
      // Auto-start first question after a brief delay
      setTimeout(() => {
        askQuestion(result.questions[0])
      }, 1000)
    } catch (err) {
      console.error("Error generating questions:", err)
      setError(err as Error)
      setState("error")
    }
  }

  const askQuestion = async (question: Question) => {
    setState("asking")
    setCurrentAnswer("")
    setIsListening(false)

    // Stop any existing audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    try {
      // Get TTS audio - use ONLY the question text
      const response = await fetch("/api/elevenlabs/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: question.question }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Failed to generate speech")
      }

      // Play audio
      const audio = new Audio(`data:audio/mp3;base64,${result.audio}`)
      
      // Clean up previous audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
      }
      
      audioRef.current = audio
      
      audio.onplay = () => setIsPlaying(true)
      audio.onended = () => {
        setIsPlaying(false)
        // Wait 5-8 seconds, then auto-start listening
        const delay = 5000 + Math.random() * 3000 // 5-8 seconds
        setTimeout(() => {
          startListening()
        }, delay)
      }
      
      audio.onerror = (err) => {
        console.error("Audio playback error:", err)
        setIsPlaying(false)
        setState("ready")
      }
      
      await audio.play()
    } catch (err) {
      console.error("Error asking question:", err)
      setError(err as Error)
      setState("error")
    }
  }

  const startListening = async () => {
    // Stop any existing recognition first
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    // Clear any existing silence timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }

    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser. Please use Chrome or Edge.")
      return
    }

    // Request microphone permission
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err) {
      alert("Microphone permission denied. Please allow microphone access and try again.")
      return
    }

    setState("listening")
    setIsListening(true)

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    let finalTranscript = ""

    recognition.onresult = (event: any) => {
      let interimTranscript = ""
      finalTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " "
        } else {
          interimTranscript += transcript
        }
      }

      // Update with both final and interim results
      const fullTranscript = finalTranscript + interimTranscript
      setCurrentAnswer(fullTranscript)
      currentAnswerRef.current = fullTranscript
      
      // Clear existing timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }
      
      // If we have a final transcript (user finished speaking), wait for silence
      if (finalTranscript.trim().length > 0) {
        // Wait 3 seconds of silence after final speech, then auto-submit
        silenceTimerRef.current = setTimeout(() => {
          // Check if we're still listening and have an answer
          const answerToSubmit = currentAnswerRef.current.trim()
          if (answerToSubmit.length > 0 && isListening && recognitionRef.current) {
            console.log("[ResumeBuddy] Auto-submitting after 3 seconds of silence")
            // Stop recognition first
            recognitionRef.current.stop()
            recognitionRef.current = null
            setIsListening(false)
            // Ensure answer is set, then submit
            setCurrentAnswer(answerToSubmit)
            setTimeout(() => {
              submitAnswer()
            }, 200)
          }
        }, 3000)
      }
    }

    recognition.onend = () => {
      // Only restart if we're still in listening state and haven't submitted
      if (isListening && state === "listening" && currentAnswer.trim().length === 0) {
        // Restart recognition if it ended unexpectedly (no answer yet)
        try {
          recognition.start()
        } catch (err) {
          console.log("Recognition already started or stopped")
          setIsListening(false)
          setState("ready")
        }
      } else {
        setIsListening(false)
        if (state === "listening") {
          setState("ready")
        }
      }
    }

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error)
      
      if (event.error === "no-speech") {
        setIsListening(false)
        setState("ready")
        recognitionRef.current = null
      } else if (event.error === "aborted") {
        setIsListening(false)
        setState("ready")
        recognitionRef.current = null
      } else if (event.error === "not-allowed") {
        alert("Microphone permission denied. Please allow microphone access.")
        setIsListening(false)
        setState("ready")
        recognitionRef.current = null
      } else {
        setIsListening(false)
        setState("ready")
        recognitionRef.current = null
      }
    }

    recognitionRef.current = recognition
    
    try {
      recognition.start()
    } catch (err) {
      console.error("Failed to start recognition:", err)
      setIsListening(false)
      setState("ready")
    }
  }

  const submitAnswer = async () => {
    if (!currentAnswer.trim()) return

    // Stop listening and clear timers
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    setIsListening(false)

    const currentQuestion = questions[currentQuestionIndex]
    
    // Add to conversation history
    const newHistory = [...conversationHistory, {
      question: currentQuestion.question,
      answer: currentAnswer,
    }]
    setConversationHistory(newHistory)

    // Move to next question or complete
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setTimeout(() => {
        askQuestion(questions[currentQuestionIndex + 1])
      }, 1000)
    } else {
      // All questions answered - process transcript
      processTranscript(newHistory)
    }
  }

  const processTranscript = async (history: typeof conversationHistory) => {
    setState("processing")
    setLoadingStep(0)

    try {
      // Step 0: Calibrating data
      console.log("[ResumeBuddy] Step 0: Calibrating data...")
      setLoadingStep(0)

      // Create transcript from conversation history
      const transcript = history.map(item => 
        `Q: ${item.question}\nA: ${item.answer}`
      ).join("\n\n")

      console.log("[ResumeBuddy] Transcript created, length:", transcript.length)
      
      // Step 1: Structuring resume
      console.log("[ResumeBuddy] Step 1: Structuring resume...")
      setLoadingStep(1)

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

      // Step 2: Optimizing ATS
      console.log("[ResumeBuddy] Step 2: Optimizing ATS...")
      setLoadingStep(2)
      
      const result = await response.json()

      if (!result.success) {
        throw new Error("Invalid response from Gemini API")
      }

      console.log("[ResumeBuddy] Received data from Gemini")

      // Update CV data
      if (result.data) {
        updateCvData(result.data)
        console.log("[ResumeBuddy] CV data updated in data.tsx")
      }

      // Step 3: Preparing preview
      console.log("[ResumeBuddy] Step 3: Preparing preview...")
      setLoadingStep(3)

      // Navigate to template selection
      setTimeout(() => {
        router.push("/cv-select")
      }, 1500)
    } catch (err) {
      console.error("[ResumeBuddy] Error processing transcript:", err)
      setError(err as Error)
      setState("error")
    }
  }

  if (state === "error" && error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <nav className="fixed top-0 left-0 right-0 h-[70px] flex items-center justify-between px-10 z-50 bg-black/70 backdrop-blur-lg border-b border-white/5">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            VoxTalent
          </Link>
        </nav>
        <main className="pt-[90px] min-h-screen flex items-center justify-center px-4">
          <ErrorState
            title="Resume Building Error"
            message={error.message}
            onRetry={() => router.push("/")}
            retryLabel="Go Home"
          />
        </main>
      </div>
    )
  }

  if (state === "loading" || state === "generating" || state === "processing") {
    const messages = state === "generating" 
      ? ["Preparing your interview", "Generating questions"]
      : state === "processing"
      ? ["Calibrating data", "Structuring resume", "Optimizing ATS", "Preparing preview"]
      : ["Loading..."]
    
    return (
      <div className="min-h-screen bg-black text-white">
        <nav className="fixed top-0 left-0 right-0 h-[70px] flex items-center justify-between px-10 z-50 bg-black/70 backdrop-blur-lg border-b border-white/5">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            VoxTalent
          </Link>
        </nav>
        <main className="pt-[90px] min-h-screen flex items-center justify-center px-4">
          <LoadingTransition
            messages={messages}
            currentStep={loadingStep}
          />
        </main>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

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
              style={{ width: `${progress}%` }}
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

          {/* Audio Controls */}
          {state === "asking" && isPlaying && (
            <div className="flex items-center gap-4 text-white/60 mb-4">
              <Pause className="h-5 w-5" />
              <span>Asking question...</span>
            </div>
          )}
          
          {state === "listening" && (
            <div className="mb-4 flex items-center gap-3">
              <div className="flex items-center gap-2 text-green-400">
                <Mic className="h-5 w-5 animate-pulse" />
                <span className="text-sm font-semibold">Listening... Speak your answer</span>
              </div>
            </div>
          )}

          {/* Answer Display (Read-only, voice-only input) */}
          {(state === "ready" || state === "listening") && (
            <div className="space-y-4">
              <div className="w-full p-4 bg-white/5 border border-white/10 rounded-lg text-white min-h-[150px]">
                {currentAnswer ? (
                  <p className="text-white whitespace-pre-wrap">{currentAnswer}</p>
                ) : (
                  <p className="text-white/40 italic">
                    {state === "listening" 
                      ? "Listening for your answer..." 
                      : "Waiting for question to finish..."}
                  </p>
                )}
              </div>
              
              {state === "listening" && currentAnswer.trim() && (
                <div className="text-xs text-white/50">
                  Speak naturally. Your answer will be submitted automatically after a few seconds of silence.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

