import { getResumeData } from "@/lib/old=data"

export default function MinimalistTemplate() {
  const data = getResumeData()

  return (
    <div className="space-y-6 text-sm">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-light text-gray-900 tracking-tight">{data.personalInfo.name || "Your Name"}</h1>
        <p className="text-gray-600 font-light mt-1">{data.personalInfo.title || "Professional Title"}</p>
        <div className="flex gap-4 mt-3 text-gray-700 text-xs">
          {data.personalInfo.contact.email && <span>{data.personalInfo.contact.email}</span>}
          {data.personalInfo.contact.phone && <span>{data.personalInfo.contact.phone}</span>}
          {data.personalInfo.location && <span>{data.personalInfo.location}</span>}
        </div>
      </div>

      {/* Experience */}
      {data.experience.length > 0 && (
        <div>
          <p className="text-gray-900 font-medium text-xs uppercase tracking-widest mb-3">Experience</p>
          <div className="space-y-4">
            {data.experience.map((job, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <p className="text-gray-900 font-medium">{job.role}</p>
                  <p className="text-gray-600 text-xs">{job.dates}</p>
                </div>
                <p className="text-gray-600 text-xs">{job.company}</p>
                <p className="text-gray-700 leading-relaxed">{job.optimizedDescription || job.rawDescription}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <div>
          <p className="text-gray-900 font-medium text-xs uppercase tracking-widest mb-3">Education</p>
          <div className="space-y-2">
            {data.education.map((edu, idx) => (
              <div key={idx}>
                <p className="text-gray-900 font-medium">{edu.degree}</p>
                <p className="text-gray-600 text-xs">
                  {edu.institution} • {edu.graduationDate}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills & Languages */}
      {(data.skills.technical.length > 0 || data.skills.soft.length > 0 || data.languages.length > 0) && (
        <div>
          <p className="text-gray-900 font-medium text-xs uppercase tracking-widest mb-3">Skills</p>
          <div className="space-y-2 text-gray-700">
            {data.skills.technical.length > 0 && (
              <p>
                <span className="text-gray-900">Technical:</span> {data.skills.technical.join(", ")}
              </p>
            )}
            {data.skills.soft.length > 0 && (
              <p>
                <span className="text-gray-900">Professional:</span> {data.skills.soft.join(", ")}
              </p>
            )}
            {data.languages.length > 0 && (
              <p>
                <span className="text-gray-900">Languages:</span> {data.languages.join(", ")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
