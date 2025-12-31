// PDF Export Service for resumes and reports

import type { ResumeData } from "./types"
import type { InterviewFeedback } from "./interprep-service"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

export class PDFService {
  static async generateResumePDF(data: ResumeData, templateName: string): Promise<Blob> {
    // Use html2pdf library to convert resume to PDF
    const html = this.generateResumeHTML(data, templateName)

    // Create a temporary container
    const container = document.createElement("div")
    container.innerHTML = html
    container.style.position = "absolute"
    container.style.left = "-9999px"
    document.body.appendChild(container)

    try {
      // Simulate PDF generation (in production, use html2pdf or similar)
      const canvas = await html2canvas(container, {
        scale: 2,
        logging: false,
      })

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const imgData = canvas.toDataURL("image/png")
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 295 // A4 height in mm
      let heightLeft = canvas.height * (imgWidth / canvas.width)
      let position = 0

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, heightLeft)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - canvas.height * (imgWidth / canvas.width)
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, heightLeft)
        heightLeft -= pageHeight
      }

      const pdfBlob = pdf.output("blob")
      return pdfBlob
    } finally {
      document.body.removeChild(container)
    }
  }

  static async downloadResumePDF(data: ResumeData, templateName: string, filename = "resume.pdf") {
    try {
      const blob = await this.generateResumePDF(data, templateName)
      this.downloadBlob(blob, filename)
    } catch (error) {
      console.error("Error generating resume PDF:", error)
      throw error
    }
  }

  static async generateInterviewReportPDF(feedback: InterviewFeedback): Promise<Blob> {
    const html = this.generateInterviewReportHTML(feedback)

    const container = document.createElement("div")
    container.innerHTML = html
    container.style.position = "absolute"
    container.style.left = "-9999px"
    document.body.appendChild(container)

    try {
      // Simulate PDF generation
      const canvas = await html2canvas(container, {
        scale: 2,
        logging: false,
      })

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const imgData = canvas.toDataURL("image/png")
      const imgWidth = 210
      const pageHeight = 295
      let heightLeft = canvas.height * (imgWidth / canvas.width)
      let position = 0

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, heightLeft)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - canvas.height * (imgWidth / canvas.width)
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, heightLeft)
        heightLeft -= pageHeight
      }

      return pdf.output("blob")
    } finally {
      document.body.removeChild(container)
    }
  }

  static async downloadInterviewReportPDF(feedback: InterviewFeedback, filename = "interview-feedback.pdf") {
    try {
      const blob = await this.generateInterviewReportPDF(feedback)
      this.downloadBlob(blob, filename)
    } catch (error) {
      console.error("Error generating interview report PDF:", error)
      throw error
    }
  }

  private static generateResumeHTML(data: ResumeData, templateName: string): string {
    return `
      <div style="font-family: Arial, sans-serif; padding: 40px; max-width: 850px; color: #000;">
        <div style="border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 32px;">${data.personalInfo.name || "Your Name"}</h1>
          <p style="margin: 5px 0; font-size: 16px; color: #666;">${data.personalInfo.title || "Professional Title"}</p>
          <div style="display: flex; gap: 20px; margin-top: 10px; font-size: 12px; color: #333;">
            ${data.personalInfo.contact.email ? `<span>${data.personalInfo.contact.email}</span>` : ""}
            ${data.personalInfo.contact.phone ? `<span>${data.personalInfo.contact.phone}</span>` : ""}
            ${data.personalInfo.location ? `<span>${data.personalInfo.location}</span>` : ""}
          </div>
        </div>

        ${
          data.experience.length > 0
            ? `
          <div style="margin-bottom: 20px;">
            <h2 style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">Experience</h2>
            ${data.experience
              .map(
                (job) => `
              <div style="margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between;">
                  <div>
                    <p style="margin: 0; font-weight: bold;">${job.role}</p>
                    <p style="margin: 3px 0; color: #666;">${job.company}</p>
                  </div>
                  <p style="margin: 0; color: #666; font-size: 12px;">${job.dates}</p>
                </div>
                <p style="margin: 5px 0 0 0; font-size: 12px; line-height: 1.4;">${job.optimizedDescription || job.rawDescription}</p>
              </div>
            `,
              )
              .join("")}
          </div>
        `
            : ""
        }

        ${
          data.education.length > 0
            ? `
          <div style="margin-bottom: 20px;">
            <h2 style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">Education</h2>
            ${data.education
              .map(
                (edu) => `
              <div style="margin-bottom: 8px;">
                <p style="margin: 0; font-weight: bold;">${edu.degree}</p>
                <p style="margin: 3px 0; color: #666;">${edu.institution}</p>
                <p style="margin: 2px 0; font-size: 12px; color: #666;">${edu.graduationDate}</p>
              </div>
            `,
              )
              .join("")}
          </div>
        `
            : ""
        }

        ${
          data.skills.technical.length > 0 || data.skills.soft.length > 0
            ? `
          <div>
            <h2 style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">Skills</h2>
            ${
              data.skills.technical.length > 0
                ? `
              <div style="margin-bottom: 8px;">
                <p style="margin: 0; font-weight: bold; font-size: 12px;">Technical:</p>
                <p style="margin: 3px 0; font-size: 12px;">${data.skills.technical.join(", ")}</p>
              </div>
            `
                : ""
            }
            ${
              data.skills.soft.length > 0
                ? `
              <div>
                <p style="margin: 0; font-weight: bold; font-size: 12px;">Professional:</p>
                <p style="margin: 3px 0; font-size: 12px;">${data.skills.soft.join(", ")}</p>
              </div>
            `
                : ""
            }
          </div>
        `
            : ""
        }
      </div>
    `
  }

  private static generateInterviewReportHTML(feedback: InterviewFeedback): string {
    return `
      <div style="font-family: Arial, sans-serif; padding: 40px; max-width: 850px; color: #000;">
        <h1 style="margin: 0 0 5px 0; font-size: 28px;">Interview Performance Report</h1>
        <p style="margin: 0 0 30px 0; color: #666; font-size: 14px;">Generated on ${new Date().toLocaleDateString()}</p>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <p style="margin: 0; color: #666; font-size: 12px; text-transform: uppercase;">Overall Score</p>
            <p style="margin: 5px 0 0 0; font-size: 48px; font-weight: bold; color: #333;">${feedback.overallScore}%</p>
          </div>
        </div>

        <h2 style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">Strengths</h2>
        <ul style="margin: 0 0 30px 0; padding-left: 20px;">
          ${feedback.strengths.map((strength) => `<li style="margin-bottom: 8px; font-size: 12px;">${strength}</li>`).join("")}
        </ul>

        <h2 style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">Areas for Improvement</h2>
        <ul style="margin: 0 0 30px 0; padding-left: 20px;">
          ${feedback.improvements.map((improvement) => `<li style="margin-bottom: 8px; font-size: 12px;">${improvement}</li>`).join("")}
        </ul>

        <h2 style="margin: 30px 0 15px 0; font-size: 16px; font-weight: bold;">Detailed Feedback</h2>
        ${feedback.detailedFeedback
          .map(
            (item) => `
          <div style="margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <p style="margin: 0; font-weight: bold; text-transform: capitalize;">${item.category}</p>
              <p style="margin: 0; font-weight: bold;">${item.score}%</p>
            </div>
            <p style="margin: 0 0 5px 0; font-size: 12px;">${item.feedback}</p>
            <p style="margin: 0; font-size: 12px; color: #666;"><strong>Suggestion:</strong> ${item.suggestion}</p>
          </div>
        `,
          )
          .join("")}

        <h2 style="margin: 30px 0 15px 0; font-size: 16px; font-weight: bold;">Recommended Next Steps</h2>
        <ol style="margin: 0 0 20px 0; padding-left: 20px;">
          ${feedback.nextSteps.map((step) => `<li style="margin-bottom: 8px; font-size: 12px;">${step}</li>`).join("")}
        </ol>
      </div>
    `
  }

  private static downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

export default PDFService
