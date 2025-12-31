import { getResumeData } from "@/lib/old=data"

export default function ClassicTemplate() {
  const data = getResumeData()

  return (
    <div className="space-y-4 text-sm font-serif">
      {/* Header */}
      <div className="text-center border-b-4 border-gray-900 pb-3">
        <h1 className="text-4xl font-bold text-gray-900">{data.personalInfo.name || "Your Name"}</h1>
        <p className="text-gray-600 mt-1">{data.personalInfo.title || "Professional Title"}</p>
        <div className="flex justify-center gap-3 mt-2 text-gray-700 text-xs">
          {data.personalInfo.contact.email && <span>{data.personalInfo.contact.email}</span>}
          {data.personalInfo.contact.phone && <span>•</span>}
          {data.personalInfo.contact.phone && <span>{data.personalInfo.contact.phone}</span>}
          {data.personalInfo.location && <span>•</span>}
          {data.personalInfo.location && <span>{data.personalInfo.location}</span>}
        </div>
      </div>

      {/* Experience */}
      {data.experience.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-900 pb-1 mb-2">
            Professional Experience
          </h2>
          <div className="space-y-3">
            {data.experience.map((job, idx) => (
              <div key={idx}>
                <div className="flex justify-between">
                  <div>
                    <p className="font-bold text-gray-900">{job.role}</p>
                    <p className="text-gray-600 italic">{job.company}</p>
                  </div>
                  <p className="text-gray-600 text-xs whitespace-nowrap ml-4">{job.dates}</p>
                </div>
                <p className="text-gray-700 mt-1">{job.optimizedDescription || job.rawDescription}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-900 pb-1 mb-2">
            Education
          </h2>
          <div className="space-y-2">
            {data.education.map((edu, idx) => (
              <div key={idx}>
                <p className="font-bold text-gray-900">{edu.degree}</p>
                <p className="text-gray-600">
                  {edu.institution}, {edu.graduationDate}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {(data.skills.technical.length > 0 || data.skills.soft.length > 0) && (
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-900 pb-1 mb-2">
            Skills
          </h2>
          <p className="text-gray-700">{[...data.skills.technical, ...data.skills.soft].join(" • ")}</p>
        </div>
      )}
    </div>
  )
}
