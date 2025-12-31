'use client';

import React, { useState, useRef, ChangeEvent } from 'react';
import { User, Edit2, Download, Upload } from 'lucide-react';
import Image from 'next/image';
import { getCvData } from '@/lib/data';

// Get CV data (will use saved data if available)
const cvData = getCvData();

// --- Interfaces ---

// 1. Define the shape of the jsPDF object to avoid 'any'
interface JsPDFInstance {
  internal: {
    getNumberOfPages: () => number;
    pageSize: {
      getWidth: () => number;
      getHeight: () => number;
    };
  };
  setPage: (pageNumber: number) => void;
  setFillColor: (color: string) => void;
  rect: (x: number, y: number, w: number, h: number, style: string) => void;
  save: (filename: string) => void;
}

// 2. Strict Options Interface
interface Html2PdfOptions {
  margin: [number, number, number, number]; // Explicit tuple length 4
  filename: string;
  image: { type: 'jpeg' | 'png' | 'webp'; quality: number };
  pagebreak: { mode: string[]; avoid: string[] };
  html2canvas: {
    scale: number;
    useCORS: boolean;
    logging: boolean;
    backgroundColor: string;
    // Typed callback parameters
    onclone: (doc: Document, element: HTMLElement) => void;
  };
  jsPDF: { unit: string; format: string; orientation: 'portrait' | 'landscape' };
}

interface SkillProps {
  label: string;
  level: number;
  isEditing: boolean;
}

// --- Components ---

// (Your EditableText and SkillBar components remain the same...)
const EditableText: React.FC<{
  tag: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
  text: string;
  className?: string;
  style?: React.CSSProperties;
  isEditing: boolean;
}> = ({ tag: Tag, text, className, style, isEditing }) => {
  return (
    <Tag
      contentEditable={isEditing}
      suppressContentEditableWarning={true}
      className={className}
      style={{
        outline: 'none',
        transition: 'background-color 0.2s',
        ...(isEditing && {
          borderBottom: '1px dashed #60a5fa',
          backgroundColor: 'rgba(239, 246, 255, 0.3)'
        }),
        ...style
      }}
    >
      {text}
    </Tag>
  );
};

const SkillBar: React.FC<SkillProps> = ({ label, level, isEditing }) => {
  // Ensure level is between 0 and 100
  const clampedLevel = Math.max(0, Math.min(100, level));
  
  return (
    <div className="skill-item" style={{ marginBottom: '12px' }}>
      <EditableText
        tag="p"
        text={label}
        isEditing={isEditing}
        style={{
          fontSize: '12px',
          color: '#ffffff',
          marginBottom: '4px',
          fontWeight: '300'
        }}
      />
      <div style={{
        width: '100%',
        height: '2px',
        backgroundColor: '#4b5563',
        position: 'relative'
      }}>
        <div
          style={{
            height: '100%',
            backgroundColor: '#ffffff',
            boxShadow: '0 0 2px rgba(255,255,255,0.8)',
            width: `${clampedLevel}%`
          }}
        ></div>
      </div>
    </div>
  );
};

// 3. Main Application Component
const ResumeBuilder = () => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeRef = useRef<HTMLDivElement>(null);

  // --- Handlers ---

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
    }
  };

  const triggerImageUpload = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDownloadPDF = async () => {
    if (!resumeRef.current) return;
    setIsEditing(false);

    const html2pdf = (await import('html2pdf.js')).default;

    setTimeout(() => {
      const element = resumeRef.current;
      if (!element) return;

      const sidebarWidthInches = 2.5;
      const verticalMargin = 0.35; 
      // Safe tuple type for the margins
      const marginConfig: [number, number, number, number] = [verticalMargin, 0, verticalMargin, 0];
      
      // Generate filename from user's full name
      const fileName = `${cvData.personalInfo.name.replace(/\s+/g, '-')}-CV.pdf`;

      const opt: Html2PdfOptions = {
        margin: marginConfig,
        filename: fileName,
        image: { type: 'png', quality: 1.0 },
        // These settings allow content to flow naturally to Page 3, 4, etc.
        pagebreak: {
          mode: ['css', 'legacy'],
          avoid: ['li', 'h3', 'h2', '.job-item', '.section-title', '.skill-item', '.details-section']
        },
        html2canvas: {
          scale: 4,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          onclone: (_clonedDoc: Document, clonedElement: HTMLElement) => {
             // 1. Dynamic Height: We set height to 'auto' so it grows to fit 3+ pages if needed.
             clonedElement.style.minHeight = 'auto';
             clonedElement.style.height = 'auto';

             // 2. The "Ghost Page" Fix:
             // We only remove the margin from the VERY last item. 
             // If you have content on Page 3, this just tightens the bottom of Page 3.
             // It does NOT delete Page 3.
             const leftColumn = clonedElement.querySelector('.resume-left');
             if (leftColumn && leftColumn.lastElementChild) {
                 (leftColumn.lastElementChild as HTMLElement).style.marginBottom = '0px';
             }

             // 3. Dynamic Sidebar Background:
             // We measure the full height (whether it's 2 pages or 10 pages) 
             // and stretch the blue background to cover it all.
             const rightColumn = clonedElement.querySelector('.resume-right');
             const bg = clonedElement.querySelector('.sidebar-bg') as HTMLElement;
             
             if(leftColumn && rightColumn && bg) {
                const maxH = Math.max(leftColumn.scrollHeight, rightColumn.scrollHeight);
                bg.style.height = `${maxH}px`;
                clonedElement.style.minHeight = `${maxH}px`;
             }
          }
        },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      // 4. Generate & Patch
      html2pdf().set(opt).from(element).toPdf().get('pdf').then((pdf: JsPDFInstance) => {
        // This automatically counts how many pages were generated based on your text
        const totalPages = pdf.internal.getNumberOfPages();
        const pageWidth = pdf.internal.pageSize.getWidth(); 
        const pageHeight = pdf.internal.pageSize.getHeight(); 
        
        // We loop through ALL pages (whether it's 2 or 20) to paint the sidebar patch
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFillColor('#082040');
            
            // Paint the top/bottom margins blue on every single page
            pdf.rect(pageWidth - sidebarWidthInches, 0, sidebarWidthInches, verticalMargin, 'F');
            pdf.rect(pageWidth - sidebarWidthInches, pageHeight - verticalMargin, sidebarWidthInches, verticalMargin, 'F');
        }
        
        pdf.save(fileName);
      });

    }, 100);
  };

  return (
    <>
      <style>{`
        .resume-container {
          min-height: 100vh;
          background-color: #f3f4f6;
          padding: 32px;
          font-family: Arial, Helvetica, sans-serif;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          position: relative;
        }

        .fab-container {
          position: fixed;
          bottom: 40px;
          right: 40px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          z-index: 50;
        }

        .fab-group {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
        }

        .fab-expandable {
          background-color: #2563eb;
          color: #ffffff;
          border-radius: 9999px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s ease-in-out;
          width: 56px;
          overflow: hidden;
          white-space: nowrap;
        }

        .fab-expandable:hover {
          width: 192px;
        }

        .fab-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          color: #ffffff;
          cursor: pointer;
          transition: color 0.2s;
        }

        .fab-button:hover {
          color: #bfdbfe;
        }

        .fab-divider {
          width: 1px;
          height: 24px;
          background-color: #60a5fa;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .fab-expandable:hover .fab-divider {
          opacity: 1;
        }

        .fab-text {
          opacity: 0;
          transition: opacity 0.3s;
        }

        .fab-expandable:hover .fab-text {
          opacity: 1;
        }

        .resume-paper {
          background-color: #ffffff;
          width: 100%;
          max-width: 900px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-height: 11in;
          position: relative; /* Needed for absolute background */
        }

        @media (min-width: 768px) {
          .resume-paper {
            flex-direction: row;
            /* Gradient removed here to prevent blur. 
               We use .sidebar-bg div instead. */
          }
        }

        /* NEW: Solid sharp background for sidebar */
        .sidebar-bg {
          position: absolute;
          top: 0;
          bottom: 0;
          right: 0;
          width: 0;
          background-color: #082040;
          z-index: 0;
        }

        @media (min-width: 768px) {
          .sidebar-bg {
            width: 240px; /* Width of the sidebar */
          }
        }

        .resume-left {
          flex: 1;
          padding: 32px;
          position: relative;
          z-index: 1; /* Content sits on top of bg */
        }

        @media (min-width: 768px) {
          .resume-left {
            padding: 40px;
          }
        }

        .resume-right {
          width: 100%;
          background-color: #082040; /* Fallback for mobile */
          color: #ffffff;
          padding: 40px 32px;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          position: relative;
          z-index: 1; /* Content sits on top of bg */
        }

        @media (min-width: 768px) {
          .resume-right {
            width: 240px;
            background-color: transparent; /* Transparent on desktop so .sidebar-bg shows through */
            padding: 160px 24px 40px 24px;
          }
        }

        /* --- Rest of Styles --- */

        .resume-header {
          display: flex;
          align-items: center;
          margin-bottom: 40px;
        }

        .profile-image-container {
          width: 96px;
          height: 96px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 24px;
          overflow: hidden;
          flex-shrink: 0;
          position: relative;
          background-color: #e5e7eb;
          color: #6b7280;
        }

        .profile-image-container.editing {
          cursor: pointer;
          outline: 4px solid #dbeafe;
        }

        .profile-image-container.editing:hover {
          outline-color: #bfdbfe;
        }

        .profile-overlay {
          position: absolute;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .profile-image-container:hover .profile-overlay {
          opacity: 1;
        }

        .profile-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .file-input {
          display: none;
        }

        .name-text {
          font-size: 36px;
          font-family: serif;
          font-weight: 700;
          color: #000000;
          letter-spacing: -0.025em;
          margin-bottom: 4px;
        }

        .title-text {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #6b7280;
        }

        .section {
          margin-bottom: 30px;
        }

        .section-title {
          font-size: 24px;
          font-family: serif;
          font-weight: 500;
          margin-bottom: 16px;
          color: #000000;
        }

        .section-title-large {
          font-size: 24px;
          font-family: serif;
          font-weight: 500;
          margin-bottom: 24px;
          color: #000000;
        }

        .profile-text {
          font-size: 14px;
          line-height: 1.75;
          color: #374151;
        }

        .job-item {
          margin-bottom: 32px;
        }

        .job-header {
          display: flex;
          flex-direction: column;
          margin-bottom: 4px;
        }

        .job-title {
          font-weight: 700;
          font-size: 16px;
          color: #000000;
        }

        .job-date {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #9ca3af;
          margin-top: 4px;
        }

        .job-list {
          list-style: disc;
          margin-left: 20px;
          margin-top: 8px;
        }

        .job-list li {
          font-size: 14px;
          color: #374151;
          margin-bottom: 4px;
        }

        .details-section {
          margin-bottom: 48px;
        }

        .details-title {
          font-size: 20px;
          font-weight: 500;
          margin-bottom: 24px;
        }

        .details-list {
          font-size: 14px;
          font-weight: 300;
          display: flex;
          flex-direction: column;
          gap: 4px;
          color: #d1d5db;
        }

        .details-link {
          text-decoration: underline;
          cursor: pointer;
          transition: color 0.2s;
        }

        .details-link:hover {
          color: #ffffff;
        }

        .skills-section {
          margin-bottom: 0;
        }

        .skills-title {
          font-size: 20px;
          font-weight: 500;
          margin-bottom: 24px;
        }

        .skills-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .references-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .reference-item {
          margin-bottom: 12px;
        }

        .reference-name {
          font-weight: 500;
          font-size: 14px;
          color: #000000;
          margin-bottom: 4px;
        }

        .reference-contact {
          font-size: 13px;
          color: #374151;
        }
      `}</style>

      <div className="resume-container">
        {/* Floating Action Button */}
        <div className="fab-container">
          <div className="fab-group">
            <div className="fab-expandable">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="fab-button"
                title="Toggle Edit Mode"
              >
                <Edit2 size={24} />
                <span className="fab-text">
                  {isEditing ? 'Done' : 'Edit'}
                </span>
              </button>

              <div className="fab-divider"></div>

              <button
                onClick={handleDownloadPDF}
                className="fab-button"
                title="Download PDF"
              >
                <Download size={24} />
                <span className="fab-text">Save</span>
              </button>
            </div>
          </div>
        </div>

        {/* Resume Paper */}
        <div ref={resumeRef} className="resume-paper">
          
          {/* BACKGROUND LAYER (Fixes gradient blur issue) */}
          <div className="sidebar-bg"></div>

          {/* LEFT COLUMN - MAIN CONTENT */}
          <div className="resume-left">
            {/* Header Section */}
            <div className="resume-header">
              <div
                onClick={triggerImageUpload}
                className={`profile-image-container ${isEditing ? 'editing' : ''}`}
              >
                {profileImage ? (
                  <Image
                    src={profileImage}
                    alt="Profile"
                    className="profile-image"
                    width={96}
                    height={96}
                    priority={false}
                  />
                ) : (
                  <User size={64} strokeWidth={1} />
                )}

                {isEditing && (
                  <div className="profile-overlay">
                    <Upload size={20} />
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="file-input"
                  accept="image/*"
                />
              </div>

              <div>
                <EditableText
                  tag="h1"
                  text={cvData.personalInfo.name}
                  isEditing={isEditing}
                  className="name-text"
                />
                <EditableText
                  tag="p"
                  text={cvData.personalInfo.title}
                  isEditing={isEditing}
                  className="title-text"
                />
              </div>
            </div>

            {/* Profile Section */}
            <section className="section">
              <h2 className="section-title">Profile</h2>
              <EditableText
                tag="p"
                isEditing={isEditing}
                className="profile-text"
                text={cvData.profile}
              />
            </section>

            {/* Employment History */}
            <section className="section">
              <h2 className="section-title-large">Employment History</h2>
              {cvData.experience.map((job, index) => (
                <div key={index} className="job-item">
                  <div className="job-header">
                    <EditableText
                      tag="h3"
                      text={`${job.position}, ${job.company}, ${job.location}`}
                      isEditing={isEditing}
                      className="job-title"
                    />
                    <EditableText
                      tag="span"
                      text={`${job.startDate} — ${job.endDate}`}
                      isEditing={isEditing}
                      className="job-date"
                    />
                  </div>
                  <ul className="job-list">
                    {job.description.map((item, itemIndex) => (
                      <li key={itemIndex}>
                        <EditableText
                          tag="span"
                          isEditing={isEditing}
                          text={item}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>

            {/* Education */}
            <section className="section">
              <h2 className="section-title-large">Education</h2>
              {cvData.education.map((edu, index) => (
                <div key={index} className="job-item">
                  <EditableText
                    tag="h3"
                    isEditing={isEditing}
                    text={`${edu.degree}, ${edu.institution}, ${edu.location}`}
                    className="job-title"
                  />
                  <EditableText
                    tag="span"
                    isEditing={isEditing}
                    text={`${edu.startDate} — ${edu.endDate}`}
                    className="job-date"
                    style={{ display: 'block' }}
                  />
                </div>
              ))}
            </section>

            {/* References */}
            <section className="section">
              <h2 className="section-title-large">References</h2>
              <div className="references-list">
                {cvData.references.map((ref, index) => (
                  <div key={index} className="reference-item">
                    <EditableText
                      tag="div"
                      isEditing={isEditing}
                      text={ref.name}
                      className="reference-name"
                    />
                    <EditableText
                      tag="div"
                      isEditing={isEditing}
                      text={ref.phone ? `${ref.email} | ${ref.phone}` : ref.email}
                      className="reference-contact"
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN - SIDEBAR */}
          <div className="resume-right">
            {/* Details */}
            <section className="details-section">
              <h2 className="details-title">Details</h2>
              <div className="details-list">
                <EditableText tag="span" isEditing={isEditing} text={cvData.personalInfo.address} />
                <EditableText tag="span" isEditing={isEditing} text={cvData.personalInfo.city} />
                <EditableText tag="span" isEditing={isEditing} text={cvData.personalInfo.country} />
                <EditableText tag="span" isEditing={isEditing} text={cvData.personalInfo.phone} />
                <EditableText
                  tag="span"
                  isEditing={isEditing}
                  text={cvData.personalInfo.email}
                  className="details-link"
                />
              </div>
            </section>

            {/* Skills */}
            <section className="skills-section">
              <h2 className="skills-title">Skills</h2>
              <div className="skills-list">
                {cvData.skills.map((skill, index) => (
                  <SkillBar key={index} label={skill.label} level={skill.level} isEditing={isEditing} />
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResumeBuilder;