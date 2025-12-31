"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

export default function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try Again",
  className,
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[400px] p-8 ${className || ""}`}>
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="mt-2">{message}</AlertDescription>
        {onRetry && (
          <div className="mt-4">
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              {retryLabel}
            </Button>
          </div>
        )}
      </Alert>
    </div>
  )
}

