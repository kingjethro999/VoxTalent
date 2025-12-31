import { getResumeData } from "@/lib/old=data"

export default function ModernTemplate() {
  const data = getResumeData()

  return (
    <div className="space-y-6 text-sm">
      {/* Header */}
      <div className="border-b-2 border-gray-900 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">{data.personalInfo.name || "Your Name"}</h1>
        <p className="text-lg text-gray-600 mt-1">{data.personalInfo.title || "Professional Title"}</p>
        <div className="flex gap-4 mt-3 text-gray-700">
          {data.personalInfo.contact.email && <span>{data.personalInfo.contact.email}</span>}
          {data.personalInfo.contact.phone && <span>{data.personalInfo.contact.phone}</span>}
          {data.personalInfo.location && <span>{data.personalInfo.location}</span>}
        </div>
      </div>

      {/* Experience */}
      {data.experience.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Experience</h2>
          <div className="space-y-4">
            {data.experience.map((job, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-900">{job.role}</p>
                    <p className="text-gray-600">{job.company}</p>
                  </div>
                  <p className="text-gray-600 text-xs">{job.dates}</p>
                </div>
                <p className="text-gray-700 mt-2">{job.optimizedDescription || job.rawDescription}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Education</h2>
          <div className="space-y-3">
            {data.education.map((edu, idx) => (
              <div key={idx}>
                <p className="font-bold text-gray-900">{edu.degree}</p>
                <p className="text-gray-600">{edu.institution}</p>
                <p className="text-gray-600 text-xs">{edu.graduationDate}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {(data.skills.technical.length > 0 || data.skills.soft.length > 0) && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Skills</h2>
          {data.skills.technical.length > 0 && (
            <div className="mb-3">
              <p className="font-semibold text-gray-900">Technical</p>
              <p className="text-gray-700">{data.skills.technical.join(", ")}</p>
            </div>
          )}
          {data.skills.soft.length > 0 && (
            <div>
              <p className="font-semibold text-gray-900">Professional</p>
              <p className="text-gray-700">{data.skills.soft.join(", ")}</p>
            </div>
          )}
        </div>
      )}

      {/* Languages */}
      {data.languages.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Languages</h2>
          <p className="text-gray-700">{data.languages.join(", ")}</p>
        </div>
      )}
    </div>
  )
}
