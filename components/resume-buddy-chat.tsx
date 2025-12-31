"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Mic, MicOff, Check } from "lucide-react"
import { GeminiAtsService } from "@/lib/gemini-service"
import { updateResumeData } from "@/lib/old=data"

declare global {
  interface Window {
    ElevenLabsConvai?: {
      startSession: (config: any) => Promise<any>
      endSession: () => Promise<void>
      sendAudio: (audio: Blob) => Promise<any>
      on: (event: string, callback: (data: any) => void) => void
    }
  }
}

export default function ResumeBuddyChat() {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [statusMessage, setStatusMessage] = useState("Ready to start. Click the mic button to begin speaking.")
  const [sessionActive, setSessionActive] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const conversationDataRef = useRef<any[]>([])

  useEffect(() => {
    loadElevenLabsSDK()
  }, [])

  const loadElevenLabsSDK = async () => {
    // Load ElevenLabs ConvAI SDK
    const script = document.createElement("script")
    script.src = "https://unpkg.com/@elevenlabs/convai-widget-embed"
    script.async = true
    document.head.appendChild(script)

    script.onload = () => {
      setStatusMessage("Ready to start. Click the mic button to begin speaking.")
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        await sendAudioToAgent(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setSessionActive(true)
      setStatusMessage("Listening... Speak now")
    } catch (error) {
      console.error("Error accessing microphone:", error)
      setStatusMessage("Error accessing microphone. Please check permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      setIsRecording(false)
      setStatusMessage("Processing your response...")
      setIsProcessing(true)
    }
  }

  const sendAudioToAgent = async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append("audio", audioBlob)
      formData.append("agent_id", process.env.NEXT_PUBLIC_RESUMEBUDDY_AGENT_ID || "")

      const response = await fetch("/api/elevenlabs/process-audio", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        conversationDataRef.current.push(data)
        setStatusMessage(data.agentResponse || "Waiting for your response...")

        // Check if conversation is complete
        if (data.conversationComplete) {
          await finalizeResume()
        } else {
          setIsProcessing(false)
        }
      } else {
        setStatusMessage("Error processing response. Try again.")
        setIsProcessing(false)
      }
    } catch (error) {
      console.error("Error sending audio:", error)
      setStatusMessage("Error communicating with agent. Try again.")
      setIsProcessing(false)
    }
  }

  const finalizeResume = async () => {
    try {
      setStatusMessage("Optimizing your resume with AI...")

      const rawResumeData = parseConversationData(conversationDataRef.current)
      const optimizedData = await GeminiAtsService.optimizeResumeData(rawResumeData)

      updateResumeData(optimizedData.optimizedData)
      setIsComplete(true)
      setStatusMessage("Resume optimized! Ready to select a template.")
      setIsProcessing(false)
    } catch (error) {
      console.error("Error optimizing resume:", error)
      setStatusMessage("Error optimizing resume. Proceeding with raw data.")
      setIsComplete(true)
      setIsProcessing(false)
    }
  }

  const parseConversationData = (conversationData: any[]) => {
    // Extract structured resume data from agent conversation responses
    return {
      personalInfo: {
        name: conversationData[0]?.name || "John Doe",
        title: conversationData[1]?.title || "Professional",
        location: conversationData[2]?.location || "",
        contact: {
          email: conversationData[3]?.email || "",
          phone: conversationData[4]?.phone || "",
          linkedin: conversationData[5]?.linkedin || "",
        },
      },
      experience: conversationData.filter((d) => d.experience).map((d) => d.experience),
      education: conversationData.filter((d) => d.education).map((d) => d.education),
      skills: {
        technical: conversationData.find((d) => d.technicalSkills)?.technicalSkills || [],
        soft: conversationData.find((d) => d.softSkills)?.softSkills || [],
      },
      languages: conversationData.find((d) => d.languages)?.languages || [],
    }
  }

  if (isComplete) {
    return (
      <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-3xl mx-auto px-4 items-center justify-center space-y-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20">
          <Check className="w-8 h-8 text-green-400" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Resume Complete!</h2>
          <p className="text-muted-foreground">Your resume has been optimized and is ready for template selection.</p>
        </div>
        <button className="px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-colors">
          Choose Template
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-3xl mx-auto px-4">
      {/* Back button */}
      <div className="mb-4">
        <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
        {/* Status message */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground">ResumeBuddy Voice Session</h2>
          <p className="text-muted-foreground">{statusMessage}</p>
        </div>

        {/* Microphone button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all transform ${
            isRecording
              ? "bg-destructive text-destructive-foreground scale-110 animate-pulse"
              : "bg-primary text-primary-foreground hover:scale-105"
          } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isRecording ? <MicOff className="w-12 h-12" /> : <Mic className="w-12 h-12" />}
        </button>

        {/* Recording indicator */}
        {isRecording && <p className="text-sm text-destructive font-medium">Recording in progress...</p>}
      </div>
    </div>
  )
}
