"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Mic, Pause } from "lucide-react"
import ErrorState from "@/components/error-state"
import LoadingTransition from "@/components/loading-transition"

interface Question {
  question: string
  category: string
  order: number
}

interface AnswerAnalysis {
  strengths: string
  improvements: string
  score: number
  suggestion: string
}

type InterviewState = "loading" | "generating" | "ready" | "asking" | "listening" | "analyzing" | "complete" | "error"

export default function InterPrepInterviewPage() {
  const router = useRouter()
  const [state, setState] = useState<InterviewState>("loading")
  const [error, setError] = useState<Error | null>(null)
  
  // Data
  const [resume, setResume] = useState<string>("")
  const [jobTitle, setJobTitle] = useState<string>("")
  const [jobDescription, setJobDescription] = useState<string>("")
  const [questions, setQuestions] = useState<Question[]>([])
  
  // Interview state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [conversationHistory, setConversationHistory] = useState<Array<{ question: string; answer: string; analysis?: AnswerAnalysis }>>([])
  
  // Answer & Analysis State
  const [currentAnswer, setCurrentAnswer] = useState("")
  const [currentAnalysis, setCurrentAnalysis] = useState<AnswerAnalysis | null>(null)
  
  // Audio & Recognition Refs
  const [isPlaying, setIsPlaying] = useState(false)
  const [isListening, setIsListening] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recognitionRef = useRef<any>(null)
  const isSubmittingRef = useRef(false) 
  const currentAnswerRef = useRef("") // Needed for accessing latest state in callbacks
  const isRequestingRef = useRef<boolean>(false) // Guard against multiple simultaneous TTS requests

  // Load data from localStorage on mount
  useEffect(() => {
    const savedResume = localStorage.getItem("voxTalent_interprep_resume")
    const savedJobTitle = localStorage.getItem("voxTalent_interprep_jobTitle")
    const savedJobDescription = localStorage.getItem("voxTalent_interprep_jobDescription")

    if (!savedResume || !savedJobTitle || !savedJobDescription) {
      setError(new Error("Missing interview data. Please start from the beginning."))
      setState("error")
      return
    }

    setResume(savedResume)
    setJobTitle(savedJobTitle)
    setJobDescription(savedJobDescription)
    
    // Generate questions
    generateQuestions(savedResume, savedJobTitle, savedJobDescription)
  }, [])

  // ----------------------------------------------------------------------
  // CORE FIX: Silence Detection using useEffect
  // ----------------------------------------------------------------------
  useEffect(() => {
    // Only run if we are actively listening and have some text
    if (!isListening || currentAnswer.trim().length === 0) return

    // Set a timer to submit after 3 seconds of no text updates
    const timer = setTimeout(() => {
      console.log("[InterPrep] Silence detected (3s). Auto-submitting...")
      submitAnswer()
    }, 3000)

    // Cleanup: If 'currentAnswer' changes (user speaks), this clears the old timer
    // and starts a fresh 3s timer.
    return () => clearTimeout(timer)
  }, [currentAnswer, isListening])

  const generateQuestions = async (resume: string, jobTitle: string, jobDescription: string) => {
    setState("generating")
    try {
      const response = await fetch("/api/gemini/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, jobTitle, jobDescription }),
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Failed to generate questions")

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
      console.log("[InterPrep] TTS request already in progress, skipping")
      return
    }

    setState("asking")
    setCurrentAnalysis(null)
    setIsListening(false)
    setCurrentAnswer("")
    currentAnswerRef.current = ""
    isSubmittingRef.current = false

    // Cleanup previous audio/recognition
    if (audioRef.current) {
        try { audioRef.current.pause() } catch(e) {}
    }
    if (recognitionRef.current) {
        recognitionRef.current.stop()
    }

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
        console.error("[InterPrep] TTS API error:", result.error)
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
        // Wait 1s then start listening
        setTimeout(() => startListening(), 1000)
      }
      
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
      // Fallback: just start listening if TTS fails
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

      const fullText = (finalTranscript + interimTranscript).replace(/\s+/g, ' ')
      
      // Update state (triggers the useEffect timer)
      if (fullText.trim()) {
        setCurrentAnswer(fullText)
        currentAnswerRef.current = fullText
      }
    }

    recognition.onend = () => {
        // FAILSAFE: If recognition stops...
        if (isSubmittingRef.current) return // We stopped it intentionally

        // If we have an answer, assume the user finished speaking and the browser cut it off
        if (currentAnswerRef.current.trim().length > 0) {
            console.log("[InterPrep] Recognition ended with text. Submitting.")
            submitAnswer()
        } else {
            // No text? Probably noise or permissions. Restart listening if we're supposed to be.
            if (state === "listening") {
                console.log("[InterPrep] Recognition restarted (empty input)")
                try { recognition.start() } catch (e) {}
            }
        }
    }

    recognition.onerror = (event: any) => {
      console.error("Speech error:", event.error)
      if (event.error === 'not-allowed') {
        setIsListening(false)
        alert("Microphone access denied.")
      }
      // For network errors etc, we let onend handle the retry logic
    }

    recognitionRef.current = recognition
    try {
        recognition.start()
    } catch(e) {
        console.error("Failed to start recognition", e)
    }
  }, [state])

  const submitAnswer = async () => {
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true

    // Stop listening
    if (recognitionRef.current) recognitionRef.current.stop()
    setIsListening(false)

    const answerToSubmit = currentAnswerRef.current.trim()
    if (!answerToSubmit) {
        // Was silent too long with no text? Restart.
        isSubmittingRef.current = false
        startListening()
        return
    }

    const currentQuestion = questions[currentQuestionIndex]
    setState("analyzing")

    try {
      // Analyze answer
      const response = await fetch("/api/gemini/analyze-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQuestion.question,
          answer: answerToSubmit,
          resume,
          jobTitle,
          jobDescription,
          conversationHistory: conversationHistory.map(item => ({ question: item.question, answer: item.answer })),
        }),
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Failed to analyze answer")

      const analysis = result.analysis
      setCurrentAnalysis(analysis)

      // Update History
      const newHistory = [...conversationHistory, {
        question: currentQuestion.question,
        answer: answerToSubmit,
        analysis,
      }]
      setConversationHistory(newHistory)

      // Clear for next
      currentAnswerRef.current = ""
      setCurrentAnswer("")

      // Wait 3 seconds so user can read analysis, then move on
      if (currentQuestionIndex < questions.length - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex(currentQuestionIndex + 1)
          askQuestion(questions[currentQuestionIndex + 1])
        }, 3000)
      } else {
        generateFinalAnalysis(newHistory)
      }
    } catch (err) {
      console.error("Error analyzing answer:", err)
      setError(err as Error)
      setState("error")
    }
  }

  const generateFinalAnalysis = async (history: typeof conversationHistory) => {
    setState("analyzing")
    try {
      const transcript = history.map(item => `Q: ${item.question}\nA: ${item.answer}`).join("\n\n")

      const response = await fetch("/api/gemini/process-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          targetRole: jobTitle,
          jobDescription,
        }),
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Failed to generate final analysis")

      localStorage.setItem("voxTalent_interviewAnalysis", result.analysis)
      setState("complete")
      
      setTimeout(() => {
        router.push("/interview")
      }, 2000)
    } catch (err) {
      console.error(err)
      setError(err as Error)
      setState("error")
    }
  }

  // --- RENDER ---

  if (state === "error" && error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <ErrorState title="Interview Error" message={error.message} onRetry={() => router.push("/")} retryLabel="Go Home" />
      </div>
    )
  }

  if (state === "loading" || state === "generating") {
    return (
      <div className="min-h-screen bg-black text-white pt-[90px] flex justify-center">
          <LoadingTransition 
            messages={["Preparing your interview", "Analyzing your resume", "Generating questions"]} 
            currentStep={state === "generating" ? 2 : 0} 
          />
      </div>
    )
  }

  if (state === "ready" && currentQuestionIndex === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">Ready to Start</h1>
        <p className="text-white/60 mb-8">We've prepared {questions.length} questions for you.</p>
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
        {/* Progress */}
        <div className="w-full max-w-2xl mb-8">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-lg p-8 mb-8">
          <div className="mb-4">
            <span className="text-xs uppercase tracking-wider text-white/40">{currentQuestion?.category}</span>
          </div>
          <h2 className="text-2xl font-semibold mb-6">{currentQuestion?.question}</h2>

          {/* Indicators */}
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

          {/* Answer Box */}
          <div className="w-full p-4 bg-white/5 border border-white/10 rounded-lg text-white min-h-[150px] mb-6">
            {currentAnswer ? (
                <p className="whitespace-pre-wrap">{currentAnswer}</p>
            ) : (
                <p className="text-white/30 italic">
                    {state === "asking" ? "Listen to the question..." : "Speak your answer..."}
                </p>
            )}
          </div>

          {/* Analysis Feedback */}
          {currentAnalysis && (
            <div className="p-4 bg-white/5 border border-white/10 rounded-lg animate-in fade-in slide-in-from-bottom-4">
              <div className="mb-2 font-semibold">Score: {currentAnalysis.score}/100</div>
              <div className="space-y-2 text-sm">
                <div><span className="text-green-400 font-semibold">Strengths:</span> {currentAnalysis.strengths}</div>
                <div><span className="text-yellow-400 font-semibold">Improvements:</span> {currentAnalysis.improvements}</div>
                <div><span className="text-blue-400 font-semibold">Suggestion:</span> {currentAnalysis.suggestion}</div>
              </div>
            </div>
          )}
          
          {state === "analyzing" && !currentAnalysis && (
             <div className="text-white/50 text-center animate-pulse">Analyzing your response...</div>
          )}
        </div>
      </main>
    </div>
  )
}