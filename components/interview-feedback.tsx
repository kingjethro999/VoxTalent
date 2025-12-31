"use client"

import { ArrowLeft, TrendingUp } from "lucide-react"
import type { InterviewFeedback as Feedback } from "@/lib/interprep-service"

interface InterviewFeedbackProps {
  feedback: Feedback
  onRestart: () => void
}

export default function InterviewFeedback({ feedback, onRestart }: InterviewFeedbackProps) {
  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-400"
    if (score >= 70) return "text-yellow-400"
    return "text-orange-400"
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-4xl mx-auto px-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border sticky top-0 bg-background">
        <button
          onClick={onRestart}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
      </div>

      {/* Overall Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-secondary rounded-lg p-8 text-center space-y-2">
          <p className="text-muted-foreground text-sm uppercase tracking-wide">Overall Score</p>
          <p className={`text-5xl font-bold ${getScoreColor(feedback.overallScore)}`}>{feedback.overallScore}%</p>
          <p className="text-sm text-muted-foreground">Interview Performance</p>
        </div>

        <div className="md:col-span-2 bg-secondary rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-4">Category Breakdown</h3>
          <div className="space-y-3">
            {feedback.detailedFeedback.map((item) => (
              <div key={item.category} className="flex items-center justify-between">
                <span className="text-sm capitalize text-foreground">{item.category}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${item.score}%` }} />
                  </div>
                  <span className={`text-sm font-medium ${getScoreColor(item.score)}`}>{item.score}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strengths */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-secondary rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Strengths
          </h3>
          <ul className="space-y-3">
            {feedback.strengths.map((strength, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                <span className="text-sm text-foreground">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-secondary rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-4">Areas for Improvement</h3>
          <ul className="space-y-3">
            {feedback.improvements.map((improvement, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                <span className="text-sm text-foreground">{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Detailed Feedback */}
      <div className="bg-secondary rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-lg mb-6">Detailed Feedback</h3>
        <div className="space-y-6">
          {feedback.detailedFeedback.map((item) => (
            <div key={item.category} className="border-b border-border pb-4 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium capitalize text-foreground">{item.category}</h4>
                <span className={`text-sm font-semibold ${getScoreColor(item.score)}`}>{item.score}%</span>
              </div>
              <p className="text-sm text-foreground mb-3">{item.feedback}</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Suggestion:</span> {item.suggestion}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-secondary rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-lg mb-4">Next Steps</h3>
        <ol className="space-y-3">
          {feedback.nextSteps.map((step, idx) => (
            <li key={idx} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                {idx + 1}
              </span>
              <span className="text-sm text-foreground pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={onRestart}
          className="flex-1 px-6 py-3 border border-primary text-primary rounded-lg font-medium hover:bg-primary/10 transition-colors"
        >
          Try Again
        </button>
        <button className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
          Download Report
        </button>
      </div>
    </div>
  )
}
