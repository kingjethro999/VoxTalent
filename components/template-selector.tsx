"use client"

import type React from "react"

import { useState } from "react"
import { Edit, Download, ArrowLeft } from "lucide-react"
import { PDFService } from "@/lib/pdf-service"
import { getResumeData } from "@/lib/old=data"
import ModernTemplate from "./templates/modern-template"
import ClassicTemplate from "./templates/classic-template"
import MinimalistTemplate from "./templates/minimalist-template"

interface Template {
  id: string
  name: string
  description: string
  component: React.ComponentType
}

const templates: Template[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean and contemporary design",
    component: ModernTemplate,
  },
  {
    id: "classic",
    name: "Classic",
    description: "Timeless professional layout",
    component: ClassicTemplate,
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Simple and elegant",
    component: MinimalistTemplate,
  },
]

export default function TemplateSelector() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("modern")
  const [mode, setMode] = useState<"select" | "preview" | "edit">("select")
  const [isDownloading, setIsDownloading] = useState(false)

  const currentTemplate = templates.find((t) => t.id === selectedTemplate)
  const CurrentComponent = currentTemplate?.component || ModernTemplate

  const handleDownloadPDF = async () => {
    setIsDownloading(true)
    try {
      const resumeData = getResumeData()
      const filename = `${resumeData.personalInfo.name || "Resume"}.pdf`
      await PDFService.downloadResumePDF(resumeData, selectedTemplate, filename)
    } catch (error) {
      console.error("Error downloading PDF:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {mode === "select" && (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
          <div className="flex items-center gap-4 mb-8">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">Select Your Template</h1>
            <p className="text-muted-foreground">Choose a professional design for your resume</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => {
                  setSelectedTemplate(template.id)
                  setMode("preview")
                }}
                className={`group cursor-pointer rounded-lg border-2 p-6 transition-all ${
                  selectedTemplate === template.id
                    ? "border-primary bg-secondary/50"
                    : "border-border hover:border-primary/50 hover:bg-secondary/30"
                }`}
              >
                <div className="space-y-4">
                  <div className="h-40 bg-muted rounded-lg flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                    <div className="text-center space-y-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 mx-auto" />
                      <p className="text-xs text-muted-foreground">{template.name} Preview</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === "preview" && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setMode("select")}
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              ← Back to Templates
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setMode("edit")}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                {isDownloading ? "Downloading..." : "Download PDF"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Live Preview */}
            <div className="lg:col-span-2 bg-white text-black p-8 rounded-lg shadow-lg">
              <CurrentComponent />
            </div>

            {/* Template Info */}
            <div className="space-y-6">
              <div className="bg-secondary rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-lg">{currentTemplate?.name} Template</h3>
                <p className="text-sm text-muted-foreground">{currentTemplate?.description}</p>

                <div className="space-y-3 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Features</p>
                    <ul className="text-sm space-y-2 mt-2">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        ATS Optimized
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Professional Layout
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Easy to Edit
                      </li>
                    </ul>
                  </div>
                </div>

                <button
                  onClick={() => setMode("edit")}
                  className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Start Editing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === "edit" && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setMode("preview")}
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              ← Back to Preview
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              {isDownloading ? "Downloading..." : "Download PDF"}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Edit Form */}
            <div className="lg:col-span-1 space-y-6">
              <EditPanel />
            </div>

            {/* Live Preview */}
            <div className="lg:col-span-2 bg-white text-black p-8 rounded-lg shadow-lg sticky top-8 h-fit">
              <CurrentComponent />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EditPanel() {
  return (
    <div className="bg-secondary rounded-lg p-6 space-y-6">
      <h3 className="font-semibold text-lg">Edit Resume</h3>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Full Name</label>
          <input
            type="text"
            placeholder="John Doe"
            className="w-full px-3 py-2 bg-input text-foreground placeholder-muted-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Professional Title</label>
          <input
            type="text"
            placeholder="Software Engineer"
            className="w-full px-3 py-2 bg-input text-foreground placeholder-muted-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            placeholder="john@example.com"
            className="w-full px-3 py-2 bg-input text-foreground placeholder-muted-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Phone</label>
          <input
            type="tel"
            placeholder="+1 (555) 000-0000"
            className="w-full px-3 py-2 bg-input text-foreground placeholder-muted-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Location</label>
          <input
            type="text"
            placeholder="New York, USA"
            className="w-full px-3 py-2 bg-input text-foreground placeholder-muted-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <button className="w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          + Add Experience
        </button>
      </div>
    </div>
  )
}
