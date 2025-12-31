"use client"

import { useState } from "react"
import Link from "next/link"
import ResumeBuddyHome from "@/components/resume-buddy-home"
import InterPrepHome from "@/components/interprep-home"

export default function Home() {
  const [activeTab, setActiveTab] = useState<"resumebuddy" | "interviewprep">("resumebuddy")
  const [showInterPrepForm, setShowInterPrepForm] = useState(false)

  return (
    <>
      <style jsx>{`
        :global(body) {
          margin: 0;
          padding: 0;
          font-family: 'Inter', sans-serif;
          background: #0a0a0c;
          color: white;
          overflow-x: hidden;
        }

        .container {
          width: 100vw !important;
          max-width: none !important;
          height: 100vh;
          position: relative;
          box-sizing: border-box;
        }

        /* Top Navbar */
        .top-nav {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          box-sizing: border-box;
          z-index: 400;
          background: rgba(10, 10, 12, 0.7);
          backdrop-filter: blur(15px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .nav-logo {
          font-weight: 800;
          font-size: 1.4rem;
          letter-spacing: -1px;
          cursor: pointer;
          background: linear-gradient(to right, #fff, #888);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .nav-links {
          display: flex;
          gap: 30px;
        }

        .nav-link {
          font-size: 0.9rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          cursor: pointer;
          transition: 0.2s;
        }

        .nav-link:hover {
          color: #fff;
        }

        /* Tab Switcher */
        .tab-nav-container {
          position: fixed;
          top: 90px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 300;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .tab-nav {
          background: rgba(30, 30, 35, 0.6);
          backdrop-filter: blur(25px);
          padding: 4px;
          border-radius: 40px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .tab-item {
          padding: 8px 18px;
          border-radius: 30px;
          cursor: pointer;
          font-weight: 700;
          font-size: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          color: rgba(255, 255, 255, 0.4);
          display: flex;
          align-items: center;
          text-align: center;
          white-space: nowrap;
          min-width: 90px;
          justify-content: center;
          background: none;
          border: none;
        }

        .tab-item.active {
          background: #232326;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }

        @media (min-width: 768px) {
          .tab-nav {
            padding: 6px;
            gap: 4px;
          }
          .tab-item {
            padding: 12px 32px;
            font-size: 15px;
            min-width: 130px;
          }
        }

        /* Landing Page & Hero */
        .landing-page {
          width: 100vw;
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at center, #1a1a20 0%, #0a0a0c 100%);
          padding-top: 50px;
          box-sizing: border-box;
        }

        .hero-title {
          font-size: clamp(3rem, 8vw, 5.5rem);
          font-weight: 800;
          margin: 0;
          background: linear-gradient(to bottom, #fff, #666);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-align: center;
        }

        .tagline-box {
          height: 2rem;
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.5);
          margin: 20px 0 40px;
          text-align: center;
        }

        .btn-main {
          padding: 16px 40px;
          border-radius: 50px;
          background: #fff;
          color: #000;
          font-weight: 700;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          font-family: 'Inter', sans-serif;
        }

        .btn-main:hover {
          transform: scale(1.05);
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.15);
        }

        .branding-bottom-right {
          position: fixed;
          bottom: 25px;
          right: 25px;
          z-index: 200;
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(255, 255, 255, 0.4);
          font-size: 13px;
          pointer-events: none;
        }

        /* Form Card Styles */
        .form-card {
          background: #151518;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          padding: 40px;
          max-width: 500px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-card h2 {
          margin: 0;
          color: #fff;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .form-card p {
          opacity: 0.5;
          margin-top: -10px;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .input-field {
          padding: 14px 18px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 0.95rem;
          font-family: 'Inter', sans-serif;
          width: 100%;
          box-sizing: border-box;
          transition: all 0.3s;
        }

        .input-field::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .input-field:focus {
          outline: none;
          border-color: #8E75FF;
          background: rgba(255, 255, 255, 0.08);
        }

        .input-field textarea {
          min-height: 120px;
          resize: none;
        }

        .btn-glass {
          padding: 12px 24px;
          border-radius: 50px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s;
          backdrop-filter: blur(10px);
          font-family: 'Inter', sans-serif;
          width: 100%;
          text-align: center;
        }

        .btn-glass:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .main-content {
          width: 100vw !important;
          max-width: none !important;
          padding: 120px 40px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 120px);
          box-sizing: border-box;
          overflow-y: auto;
        }

        .main-content.has-scroll {
          justify-content: flex-start;
        }
      `}</style>

      <div className="container">
        {/* Top Navbar */}
        <nav className="top-nav">
          <div className="nav-logo">VoxTalent</div>
          <div className="nav-links">
            <Link href="/credits" className="nav-link">
              Credits
            </Link>
          </div>
        </nav>

        {/* Tab Navigation */}
        <div className="tab-nav-container">
          <div className="tab-nav">
            <button
              className={`tab-item ${activeTab === "resumebuddy" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("resumebuddy")
                setShowInterPrepForm(false)
              }}
            >
              ResumeBuddy
            </button>
            <button
              className={`tab-item ${activeTab === "interviewprep" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("interviewprep")
              }}
            >
              InterPrep
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className={`main-content ${activeTab === "interviewprep" ? "has-scroll" : ""}`}>
          {activeTab === "resumebuddy" && <ResumeBuddyHome />}
          {activeTab === "interviewprep" && <InterPrepHome />}
        </div>
      </div>
    </>
  )
}
