"use client"

interface TabNavigationProps {
  activeTab: "resumebuddy" | "interprep"
  onTabChange: (tab: "resumebuddy" | "interprep") => void
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex gap-2 bg-secondary rounded-full p-1">
      <button
        onClick={() => onTabChange("resumebuddy")}
        className={`px-6 py-2 rounded-full font-medium transition-colors ${
          activeTab === "resumebuddy"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        ResumeBuddy
      </button>
      <button
        onClick={() => onTabChange("interprep")}
        className={`px-6 py-2 rounded-full font-medium transition-colors ${
          activeTab === "interprep"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        InterPrep
      </button>
    </div>
  )
}
