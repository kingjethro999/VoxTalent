import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "VoxTalent AI - Voice Interaction",
  description: "Voice-powered AI agent interaction",
}

export default function AILayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
