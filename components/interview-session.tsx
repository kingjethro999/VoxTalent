"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Mic, MicOff, Volume2, RotateCcw } from "lucide-react"
import { InterPrepService, type InterviewContext } from "@/lib/interprep-service"
import InterviewFeedback from "./interview-feedback"
import type { InterviewFeedback as FeedbackType } from "@/lib/interprep-service"

interface InterviewSessionProps {
  context: InterviewContext
  onBack: () => void
}

const INTERVIEW_QUESTIONS = [
  "Tell me about yourself and your background in this field.",
  "What attracted you to this role and our company?",
  "Describe a challenging project you've worked on and how you overcame obstacles.",
  "How do you stay updated with the latest trends and technologies?",
  "Tell me about a time you worked with a difficult team member. How did you handle it?",
  "What are your salary expectations for this role?",
  "Do you have any questions for us?",
]

export default function InterviewSession({ context, onBack }: InterviewSessionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackType | null>(null)
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const serviceRef = useRef(new InterPrepService())

  useEffect(() => {
    serviceRef.current.setContext(context)
  }, [context])

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        // Audio is ready in audioChunksRef.current
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Error accessing microphone:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      setIsRecording(false)

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }
  }

  const moveToNextQuestion = () => {
    if (currentQuestionIndex < INTERVIEW_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setRecordingTime(0)
    } else {
      finishInterview()
    }
  }

  const finishInterview = async () => {
    setIsGeneratingFeedback(true)
    try {
      const service = serviceRef.current
      const generatedFeedback = await service.generateFeedback()
      setFeedback(generatedFeedback)
      setSessionComplete(true)
    } catch (error) {
      console.error("Error generating feedback:", error)
    } finally {
      setIsGeneratingFeedback(false)
    }
  }

  if (sessionComplete && feedback) {
    return <InterviewFeedback feedback={feedback} onRestart={onBack} />
  }

  const currentQuestion = INTERVIEW_QUESTIONS[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === INTERVIEW_QUESTIONS.length - 1

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-3xl mx-auto px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {INTERVIEW_QUESTIONS.length}
          </p>
        </div>
        <div className="w-8" /> {/* Spacer for alignment */}
      </div>

      {/* Question Display */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-8 mb-8">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground uppercase tracking-wide">Interview Question</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground max-w-2xl">{currentQuestion}</h2>
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <div className="flex items-center gap-3 px-4 py-2 bg-destructive/20 rounded-full">
            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-sm text-destructive font-medium">
              Recording • {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, "0")}
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <div className="flex gap-3 justify-center">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              isRecording
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {isRecording ? (
              <>
                <MicOff className="w-5 h-5" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                Start Recording
              </>
            )}
          </button>

          <button className="flex items-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors">
            <Volume2 className="w-5 h-5" />
          </button>

          <button className="flex items-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors">
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={moveToNextQuestion}
          disabled={isRecording || isGeneratingFeedback}
          className="w-full px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLastQuestion ? (isGeneratingFeedback ? "Generating Feedback..." : "Finish Interview") : "Next Question"}
        </button>
      </div>
    </div>
  )
}
