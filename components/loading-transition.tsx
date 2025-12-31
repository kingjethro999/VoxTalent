"use client"

import { Loader2 } from "lucide-react"

interface LoadingTransitionProps {
  messages?: string[]
  currentStep?: number
}

const defaultMessages = [
  "Compiling your resume",
  "Optimizing for ATS",
  "Preparing preview",
]

export default function LoadingTransition({
  messages = defaultMessages,
  currentStep = 0,
}: LoadingTransitionProps) {
  const currentMessage = messages[currentStep] || messages[messages.length - 1]

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
      <div className="relative">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-foreground">{currentMessage}...</p>
        <div className="flex gap-1 justify-center">
          {messages.map((_, index) => (
            <div
              key={index}
              className={`h-1 w-1 rounded-full transition-all ${
                index <= currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

