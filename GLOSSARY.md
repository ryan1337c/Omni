# Resume Tailoring

Turns a user's source resume into a tailored resume for a specific job description, then scores it against that job's keywords.

## Language

**Source Resume**:
The resume the user uploads, before any tailoring.
_Avoid_: Original resume, input resume

**Tailored Resume**:
The structured resume produced from a Source Resume for one job description.

**Section**:
One titled block of a Tailored Resume. The sections are Professional Summary, Education, Experience, Projects, Technical Skills, and Licenses, Certifications, and Awards. A Section with no content is omitted.

**Section Order**:
The sequence in which Sections appear. It starts from a fixed default, and the user can change it.

**Entry**:
One item within a Section, such as a single job, school, project, skill category, or Honor.

**Bullet**:
One line of accomplishment or detail listed under an Entry.
_Avoid_: Point, item

**Professional Summary**:
A 2–4 sentence paragraph at the top of the resume that follows the Who, What, Value formula. It appears only when the Source Resume has a summary-like paragraph to tailor.
_Avoid_: Objective, profile, about me

**Honor**:
One entry in the Licenses, Certifications, and Awards section: a title, its issuer, its date, and an optional one-line context description.
_Avoid_: Award (when meaning any entry), achievement, certificate

**Placeholder**:
A hint shown in an empty field in the scoring UI. It is never part of the resume content.
