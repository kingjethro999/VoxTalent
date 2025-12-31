"use client"

import { useRouter } from "next/navigation"

export default function ResumeBuddyHome() {
  const router = useRouter()

  const handleStartCrafting = () => {
    router.push("/resumebuddy-interview")
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: "40px",
        width: "100%",
        height: "100%",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h1
          style={{
            fontSize: "clamp(3rem, 8vw, 5.5rem)",
            fontWeight: 800,
            margin: 0,
            background: "linear-gradient(to bottom, #fff, #666)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          ResumeBuddy
        </h1>
        <p style={{ fontSize: "1.1rem", color: "rgba(255, 255, 255, 0.5)", margin: 0 }}>
          Craft a winning resume with voice. Professional designs, AI intelligence.
        </p>
      </div>
      <button
        onClick={handleStartCrafting}
        style={{
          padding: "16px 40px",
          borderRadius: "50px",
          background: "#fff",
          color: "#000",
          fontWeight: 700,
          fontSize: "1rem",
          border: "none",
          cursor: "pointer",
          transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          fontFamily: "Inter, sans-serif",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.05)"
          e.currentTarget.style.boxShadow = "0 0 30px rgba(255, 255, 255, 0.15)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)"
          e.currentTarget.style.boxShadow = "none"
        }}
      >
        Start Crafting
      </button>
    </div>
  )
}
