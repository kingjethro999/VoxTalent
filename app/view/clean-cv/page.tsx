'use client';

import React, { useState, useRef } from 'react';
import { Edit2, Download } from 'lucide-react';
import { getCvData } from '@/lib/data';
const cvData = getCvData();

// --- Interfaces ---

interface JsPDFInstance {
  internal: {
    getNumberOfPages: () => number;
    pageSize: {
      getWidth: () => number;
      getHeight: () => number;
    };
  };
  setPage: (pageNumber: number) => void;
  setDrawColor: (color: string) => void;
  setLineWidth: (width: number) => void;
  line: (x1: number, y1: number, x2: number, y2: number) => void;
  save: (filename: string) => void;
}

interface Html2PdfOptions {
  margin: [number, number, number, number];
  filename: string;
  image: { type: 'jpeg' | 'png' | 'webp'; quality: number };
  pagebreak: { mode: string[]; avoid: string[] };
  html2canvas: {
    scale: number;
    useCORS: boolean;
    logging: boolean;
    backgroundColor: string;
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
        minWidth: '20px',
        transition: 'background-color 0.2s',
        ...(isEditing && {
          borderBottom: '1px dashed #9ca3af',
          backgroundColor: 'rgba(243, 244, 246, 0.5)'
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
    <div className="skill-item skill-bar-container">
      <EditableText
        tag="p"
        text={label}
        isEditing={isEditing}
        className="skill-label"
      />
      <div className="skill-bar-track">
        <div
          className="skill-bar-fill"
          style={{ width: `${clampedLevel}%` }}
        ></div>
      </div>
    </div>
  );
};

// 3. Main Resume Builder
const CleanResumeBuilder = () => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const resumeRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!resumeRef.current) return;
    setIsEditing(false);

    const html2pdf = (await import('html2pdf.js')).default;

    setTimeout(() => {
      const element = resumeRef.current;
      if (!element) return;

      const verticalMargin = 0.4; 
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
          avoid: ['li', 'h3', 'h2', '.job-item', '.section-title', '.skill-item', '.detail-group']
        },
        html2canvas: {
          scale: 4,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          onclone: (_clonedDoc: Document, clonedElement: HTMLElement) => {
             // 1. Remove top padding from header to eliminate giant space
             const header = clonedElement.querySelector('.header-section') as HTMLElement;
             if (header) {
               header.style.paddingTop = '0px';
               header.style.marginTop = '0px';
             }

             // 2. Remove top padding from columns
             const leftCol = clonedElement.querySelector('.left-column') as HTMLElement;
             const rightCol = clonedElement.querySelector('.right-column') as HTMLElement;
             if (leftCol) leftCol.style.paddingTop = '0px';
             if (rightCol) rightCol.style.paddingTop = '0px';

             // 3. Dynamic Height: We set height to 'auto' so it grows to fit 3+ pages if needed.
             clonedElement.style.minHeight = 'auto';
             clonedElement.style.height = 'auto';

             // 4. The "Ghost Page" Fix:
             // We only remove the margin from the VERY last item. 
             // If you have content on Page 3, this just tightens the bottom of Page 3.
             // It does NOT delete Page 3.
             if (leftCol && leftCol.lastElementChild) {
                 (leftCol.lastElementChild as HTMLElement).style.marginBottom = '0px';
             }
             if (rightCol && rightCol.lastElementChild) {
                 (rightCol.lastElementChild as HTMLElement).style.marginBottom = '0px';
             }

             // 5. Force the container to stretch so the CSS vertical border reaches the bottom
             if(leftCol && rightCol) {
                const maxH = Math.max(leftCol.scrollHeight, rightCol.scrollHeight);
                const wrapper = clonedElement.querySelector('.columns-container') as HTMLElement;
                // We ensure the wrapper is at least the height of the page content
                if(wrapper) wrapper.style.minHeight = `${maxH}px`;
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
        
        // Position for the vertical line (35% width)
        const lineX = pageWidth * 0.35; 

        // We only draw the manual line on Page 2 and beyond.
        // On Page 1, the CSS border-right handles it (respecting the header layout).
        for (let i = 2; i <= totalPages; i++) {
            pdf.setPage(i);
            
            pdf.setDrawColor('#e5e7eb'); // Match the gray-200 border
            pdf.setLineWidth(0.01);      // Thin line
            
            // Draw full vertical line on extra pages
            pdf.line(lineX, 0, lineX, pageHeight);
        }
        
        pdf.save(fileName);
      });

    }, 100);
  };

  return (
    <>
      <style>{`
        /* Global Styles */
        .cv-container {
          min-height: 100vh;
          background-color: #f3f4f6;
          padding: 40px;
          display: flex;
          justify-content: center;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
        
        .cv-paper {
          background-color: #ffffff;
          width: 100%;
          max-width: 900px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          min-height: 11in;
          display: flex;
          flex-direction: column; /* Stack Header then Columns */
          position: relative;
        }

        /* --- SECTION 1: HEADER --- */
        .header-section {
            padding: 40px 40px 30px 40px;
            width: 100%;
        }

        .name-header {
          font-size: 42px;
          font-weight: 700;
          line-height: 1.1;
          color: #111827;
          text-transform: uppercase;
          margin-bottom: 8px;
          letter-spacing: 0.05em;
        }

        .role-header {
          font-size: 16px;
          color: #6b7280;
          font-weight: 400;
        }

        /* --- SECTION 2: HORIZONTAL LINE --- */
        .horizontal-divider {
            width: 100%;
            height: 1px;
            background-color: #e5e7eb; /* Gray-200 */
            margin: 0;
        }

        /* --- SECTION 3: COLUMNS --- */
        .columns-container {
            display: flex;
            flex-direction: row;
            flex: 1; /* Take remaining height */
        }

        /* Left Column */
        .left-column {
          width: 35%;
          padding: 40px;
          /* This CSS border creates the vertical line on Page 1 */
          border-right: 1px solid #e5e7eb; 
          display: flex;
          flex-direction: column;
        }
        
        /* Page break handling for left column */
        @media print {
          .left-column {
            page-break-inside: auto;
          }
          .left-column > * {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }

        /* Right Column */
        .right-column {
          width: 65%;
          padding: 40px;
          display: flex;
          flex-direction: column;
        }

        /* Typography & Components */
        .section-title {
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #111827;
          margin-bottom: 24px;
          padding-bottom: 8px;
          border-bottom: 2px solid #111827;
          display: inline-block;
          min-width: 40px;
        }

        /* Job Items */
        .job-item { margin-bottom: 32px; }
        .job-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
        .job-role { font-weight: 700; font-size: 16px; color: #111827; }
        .job-location { font-size: 12px; color: #6b7280; text-align: right; }
        .job-date { font-size: 11px; color: #6b7280; margin-bottom: 12px; display: block; }
        .job-list { list-style: disc; margin-left: 16px; color: #4b5563; font-size: 13px; line-height: 1.6; }
        .job-list li { padding-left: 8px; margin-bottom: 4px; }

        /* Details */
        .detail-group { margin-bottom: 24px; }
        .detail-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #111827; margin-bottom: 4px; }
        .detail-text { font-size: 13px; color: #4b5563; line-height: 1.5; }

        /* Skills */
        .skill-bar-container { margin-bottom: 20px; }
        .skill-label { font-size: 14px; color: #374151; margin-bottom: 8px; }
        .skill-bar-track { width: 100%; height: 6px; background-color: #e5e7eb; }
        .skill-bar-fill { height: 100%; background-color: #000000; }

        /* Spacing Utilities */
        .mb-8 { margin-bottom: 25px; }
        .profile-text { font-size: 14px; color: #4b5563; line-height: 1.75; }

        /* FAB */
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

      `}</style>

      <div className="cv-container">
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

        <div ref={resumeRef} className="cv-paper">
            
            {/* 1. FULL WIDTH HEADER */}
            <div className="header-section">
                <EditableText 
                    tag="h1" 
                    text={cvData.personalInfo.name.toUpperCase()} 
                    isEditing={isEditing} 
                    className="name-header"
                />
                <EditableText 
                    tag="p" 
                    text={cvData.personalInfo.title} 
                    isEditing={isEditing} 
                    className="role-header"
                />
            </div>

            {/* 2. HORIZONTAL LINER */}
            <div className="horizontal-divider"></div>

            {/* 3. COLUMNS CONTAINER (With Vertical Divider via CSS) */}
            <div className="columns-container">
                
                {/* LEFT COLUMN */}
                <div className="left-column">
                    <div className="mb-8">
                        <h2 className="section-title">DETAILS</h2>
                        <div className="detail-group">
                            <p className="detail-label">ADDRESS</p>
                            <EditableText tag="div" isEditing={isEditing} text={cvData.personalInfo.address} className="detail-text" />
                            <EditableText tag="div" isEditing={isEditing} text={cvData.personalInfo.city} className="detail-text" />
                            <EditableText tag="div" isEditing={isEditing} text={cvData.personalInfo.country} className="detail-text" />
                        </div>
                        <div className="detail-group">
                            <p className="detail-label">PHONE</p>
                            <EditableText tag="div" isEditing={isEditing} text={cvData.personalInfo.phone} className="detail-text" />
                        </div>
                        <div className="detail-group">
                            <p className="detail-label">EMAIL</p>
                            <EditableText tag="div" isEditing={isEditing} text={cvData.personalInfo.email} className="detail-text" />
                        </div>
                        {cvData.personalInfo.nationality && (
                          <div className="detail-group">
                            <p className="detail-label">NATIONALITY</p>
                            <EditableText tag="div" isEditing={isEditing} text={cvData.personalInfo.nationality} className="detail-text" />
                          </div>
                        )}
                    </div>

                    <div className="mb-8">
                        <h2 className="section-title">SKILLS</h2>
                        {cvData.skills.map((skill, index) => (
                          <SkillBar key={index} label={skill.label} level={skill.level} isEditing={isEditing} />
                        ))}
                    </div>

                    {cvData.languages && cvData.languages.length > 0 && (
                      <div className="mb-8">
                        <h2 className="section-title">LANGUAGES</h2>
                        {cvData.languages.map((language, index) => (
                          <SkillBar key={index} label={language.name} level={language.proficiency} isEditing={isEditing} />
                        ))}
                      </div>
                    )}
                </div>

                {/* RIGHT COLUMN */}
                <div className="right-column">
                    <div className="mb-8">
                        <h2 className="section-title">PROFILE</h2>
                        <EditableText 
                            tag="p" 
                            isEditing={isEditing}
                            className="profile-text"
                            text={cvData.profile}
                        />
                    </div>

                    <div className="mb-8">
                        <h2 className="section-title">EMPLOYMENT HISTORY</h2>
                        {cvData.experience.map((job, index) => (
                          <div key={index} className="job-item">
                            <div className="job-header">
                              <EditableText 
                                tag="span" 
                                text={`${job.position}, ${job.company}`} 
                                isEditing={isEditing} 
                                className="job-role" 
                              />
                              <EditableText 
                                tag="span" 
                                text={job.location} 
                                isEditing={isEditing} 
                                className="job-location" 
                              />
                            </div>
                            <EditableText 
                              tag="span" 
                              text={`${job.startDate} — ${job.endDate}`} 
                              isEditing={isEditing} 
                              className="job-date" 
                            />
                            <ul className="job-list">
                              {job.description.map((item, itemIndex) => (
                                <li key={itemIndex}>
                                  <EditableText tag="span" isEditing={isEditing} text={item} />
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                    </div>

                    <div>
                        <h2 className="section-title">EDUCATION</h2>
                        {cvData.education.map((edu, index) => (
                          <div key={index} className="job-item">
                            <div className="job-header">
                              <EditableText 
                                tag="span" 
                                text={`${edu.degree}, ${edu.institution}`} 
                                isEditing={isEditing} 
                                className="job-role" 
                              />
                              <EditableText 
                                tag="span" 
                                text={edu.location} 
                                isEditing={isEditing} 
                                className="job-location" 
                              />
                            </div>
                            <EditableText 
                              tag="span" 
                              text={`${edu.startDate} — ${edu.endDate}`} 
                              isEditing={isEditing} 
                              className="job-date" 
                            />
                          </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
      </div>
    </>
  );
};

export default CleanResumeBuilder;