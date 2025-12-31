"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Mic, MicOff, Play, Pause } from "lucide-react"
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
  const [currentAnswer, setCurrentAnswer] = useState("")
  const [currentAnalysis, setCurrentAnalysis] = useState<AnswerAnalysis | null>(null)
  
  // Audio
  const [isPlaying, setIsPlaying] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recognitionRef = useRef<any>(null)

  // Load data from localStorage
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

  const generateQuestions = async (resume: string, jobTitle: string, jobDescription: string) => {
    setState("generating")
    try {
      const response = await fetch("/api/gemini/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, jobTitle, jobDescription }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Failed to generate questions")
      }

      setQuestions(result.questions)
      setState("ready")
      // Auto-start first question
      setTimeout(() => {
        askQuestion(result.questions[0])
      }, 500)
    } catch (err) {
      console.error("Error generating questions:", err)
      setError(err as Error)
      setState("error")
    }
  }

  const askQuestion = async (question: Question) => {
    setState("asking")
    setCurrentAnswer("")
    setCurrentAnalysis(null)
    setIsListening(false)

    try {
      // Get TTS audio
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
      audioRef.current = audio
      
      audio.onplay = () => setIsPlaying(true)
      audio.onended = () => {
        setIsPlaying(false)
        // Start listening after question is asked
        startListening()
      }
      
      audio.play()
    } catch (err) {
      console.error("Error asking question:", err)
      setError(err as Error)
      setState("error")
    }
  }

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser")
      return
    }

    setState("listening")
    setIsListening(true)

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: any) => {
      let transcript = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setCurrentAnswer(transcript)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error)
      setIsListening(false)
      setState("ready")
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
    setState("ready")
  }

  const submitAnswer = async () => {
    if (!currentAnswer.trim()) return

    const currentQuestion = questions[currentQuestionIndex]
    setState("analyzing")

    try {
      // Analyze answer
      const response = await fetch("/api/gemini/analyze-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQuestion.question,
          answer: currentAnswer,
          resume,
          jobTitle,
          jobDescription,
          conversationHistory: conversationHistory.map(item => ({ question: item.question, answer: item.answer })),
        }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Failed to analyze answer")
      }

      const analysis = result.analysis
      setCurrentAnalysis(analysis)

      // Add to conversation history
      const newHistory = [...conversationHistory, {
        question: currentQuestion.question,
        answer: currentAnswer,
        analysis,
      }]
      setConversationHistory(newHistory)

      // Move to next question or complete
      if (currentQuestionIndex < questions.length - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex(currentQuestionIndex + 1)
          askQuestion(questions[currentQuestionIndex + 1])
        }, 3000)
      } else {
        // Interview complete - generate final analysis
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
      const transcript = history.map(item => 
        `Q: ${item.question}\nA: ${item.answer}`
      ).join("\n\n")

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
      if (!result.success) {
        throw new Error(result.error || "Failed to generate final analysis")
      }

      // Store analysis and navigate
      localStorage.setItem("voxTalent_interviewAnalysis", result.analysis)
      setState("complete")
      
      setTimeout(() => {
        router.push("/interview")
      }, 2000)
    } catch (err) {
      console.error("Error generating final analysis:", err)
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
            title="Interview Error"
            message={error.message}
            onRetry={() => router.push("/")}
            retryLabel="Go Home"
          />
        </main>
      </div>
    )
  }

  if (state === "loading" || state === "generating") {
    return (
      <div className="min-h-screen bg-black text-white">
        <nav className="fixed top-0 left-0 right-0 h-[70px] flex items-center justify-between px-10 z-50 bg-black/70 backdrop-blur-lg border-b border-white/5">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            VoxTalent
          </Link>
        </nav>
        <main className="pt-[90px] min-h-screen flex items-center justify-center px-4">
          <LoadingTransition
            messages={["Preparing your interview", "Analyzing your resume", "Generating questions"]}
            currentStep={state === "generating" ? 2 : 0}
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
            <div className="flex items-center gap-4 text-white/60">
              <Pause className="h-5 w-5" />
              <span>Asking question...</span>
            </div>
          )}

          {/* Answer Input */}
          {state === "ready" || state === "listening" ? (
            <div className="space-y-4">
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer or use voice input..."
                className="w-full p-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 resize-none"
                rows={6}
              />
              
              <div className="flex items-center gap-4">
                {!isListening ? (
                  <button
                    onClick={startListening}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-white/90 transition-colors"
                  >
                    <Mic className="h-5 w-5" />
                    Start Voice Input
                  </button>
                ) : (
                  <button
                    onClick={stopListening}
                    className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
                  >
                    <MicOff className="h-5 w-5" />
                    Stop Recording
                  </button>
                )}
                
                <button
                  onClick={submitAnswer}
                  disabled={!currentAnswer.trim() || state === "analyzing"}
                  className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {state === "analyzing" ? "Analyzing..." : "Submit Answer"}
                </button>
              </div>
            </div>
          ) : null}

          {/* Analysis Display */}
          {currentAnalysis && (
            <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
              <div className="mb-2">
                <span className="text-sm font-semibold">Score: {currentAnalysis.score}/100</span>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-green-400 font-semibold">Strengths:</span> {currentAnalysis.strengths}
                </div>
                <div>
                  <span className="text-yellow-400 font-semibold">Improvements:</span> {currentAnalysis.improvements}
                </div>
                <div>
                  <span className="text-blue-400 font-semibold">Suggestion:</span> {currentAnalysis.suggestion}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {state === "analyzing" && !currentAnalysis && (
          <div className="text-white/60">Analyzing your answer...</div>
        )}
      </main>
    </div>
  )
}

