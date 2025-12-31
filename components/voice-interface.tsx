"use client"

import { useState, useRef, useEffect } from "react"
import { ElevenLabsService, RESUME_BUDDY_AGENT, INTERPREP_AGENT } from "@/lib/elevenlabs-service"

interface InterviewContext {
  targetRole: string
  jobDescription: string
}

interface VoiceInterfaceProps {
  mode?: "resumebuddy" | "interprep"
  interviewContext?: InterviewContext
}

export default function VoiceInterface({ mode = "resumebuddy", interviewContext }: VoiceInterfaceProps) {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [agentResponse, setAgentResponse] = useState("")
  const [audioLevel, setAudioLevel] = useState(0)
  const [transcript, setTranscript] = useState("")
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string }>>([])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const serviceRef = useRef<ElevenLabsService | null>(null)

  useEffect(() => {
    const agentConfig = mode === "interprep" ? INTERPREP_AGENT : RESUME_BUDDY_AGENT
    serviceRef.current = new ElevenLabsService(agentConfig.agentId)

    // If InterPrep mode, provide context to agent
    if (mode === "interprep" && interviewContext) {
      const contextMessage = `You are conducting an interview for the position of ${interviewContext.targetRole}. Job description: ${interviewContext.jobDescription}`
      setConversationHistory([{ role: "system", content: contextMessage }])
    }
  }, [mode, interviewContext])

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      const analyser = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyser)
      analyserRef.current = analyser

      mediaRecorderRef.current = new MediaRecorder(stream)
      chunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (e) => {
        chunksRef.current.push(e.data)
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/wav" })
        await processAudio(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsListening(true)

      animateAudioLevel(analyser)
    } catch (error) {
      console.error("Failed to start recording:", error)
    }
  }

  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop()
      setIsListening(false)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      setIsProcessing(true)
    }
  }

  const animateAudioLevel = (analyser: AnalyserNode) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    const animate = () => {
      analyser.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      setAudioLevel(average / 255)
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()
  }

  const processAudio = async (audioBlob: Blob) => {
    try {
      if (!serviceRef.current) return

      const result = await serviceRef.current.sendAudio(audioBlob, conversationHistory)
      setAgentResponse(result.response)
      setConversationHistory([
        ...conversationHistory,
        { role: "user", content: "audio input" },
        { role: "assistant", content: result.response },
      ])
      setIsProcessing(false)

      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(result.response)
        window.speechSynthesis.speak(utterance)
      }
    } catch (error) {
      console.error("Failed to process audio:", error)
      setIsProcessing(false)
    }
  }

  const handleTryCall = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const getModeLabel = () => {
    return mode === "interprep" ? `Interview: ${interviewContext?.targetRole || "Interview"}` : "Resume Buddy"
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-6">
      <style jsx>{`
        @keyframes radialGradient {
          0% {
            background: conic-gradient(from 0deg, #22c55e 0deg, #16a34a 90deg, #22c55e 180deg, #16a34a 270deg, #22c55e 360deg);
          }
          50% {
            background: conic-gradient(from 180deg, #fda34b 0deg, #f97316 90deg, #fda34b 180deg, #f97316 270deg, #fda34b 360deg);
          }
          100% {
            background: conic-gradient(from 360deg, #22c55e 0deg, #16a34a 90deg, #22c55e 180deg, #16a34a 270deg, #22c55e 360deg);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .radial-circle {
          width: 360px;
          height: 360px;
          border-radius: 50%;
          background: conic-gradient(from 0deg, #22c55e 0deg, #fda34b 90deg, #22c55e 180deg, #fda34b 270deg, #22c55e 360deg);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 60px rgba(34, 197, 94, 0.3), 0 0 120px rgba(253, 163, 75, 0.2);
          animation: ${isListening ? "pulse 1.5s ease-in-out infinite" : "none"};
        }

        .radial-circle::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0) 70%);
          pointer-events: none;
        }

        .call-button {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: white;
          color: black;
          border: none;
          border-radius: 50px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
        }

        .call-button:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 20px rgba(255, 255, 255, 0.2);
        }

        .call-button.active {
          background: #ef4444;
          color: white;
        }

        .call-icon {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: currentColor;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mode-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
      `}</style>

      <div className="flex flex-col items-center gap-8 mb-12">
        {/* Mode Label */}
        <div className="mode-label">{getModeLabel()}</div>

        {/* Radial Circle */}
        <div className="radial-circle">
          <button
            className={`call-button ${isListening || isProcessing ? "active" : ""}`}
            onClick={handleTryCall}
            disabled={isProcessing}
          >
            <div className="call-icon">
              {isListening || isProcessing ? (
                <div className="w-full h-full rounded-full bg-current animate-pulse" />
              ) : (
                <div>🎤</div>
              )}
            </div>
            {isProcessing ? "Processing..." : isListening ? "Stop" : "Try a call"}
          </button>
        </div>

        {/* Transcript Display */}
        {transcript && (
          <div className="w-full bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4 text-center text-gray-300 text-sm">
            "{transcript}"
          </div>
        )}

        {/* Agent Response */}
        {agentResponse && (
          <div className="w-full bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Agent Response</div>
            <div className="text-white text-sm leading-relaxed">{agentResponse}</div>
          </div>
        )}

        {/* Conversation History */}
        {conversationHistory.length > 1 && (
          <div className="w-full bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-4 max-h-48 overflow-y-auto">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">Conversation</div>
            <div className="space-y-2">
              {conversationHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`text-xs p-2 rounded ${msg.role === "assistant" ? "bg-blue-900/20 text-blue-200" : "bg-gray-800/40 text-gray-300"}`}
                >
                  <span className="font-semibold">{msg.role}:</span> {msg.content.slice(0, 100)}...
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
