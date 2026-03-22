This file is a merged representation of the entire codebase, combined into a single document by Repomix.
The content has been processed where security check has been disabled.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Security check has been disabled - content may contain sensitive information
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
backend/
  app/
    api/
      __init__.py
      health.py
      match.py
      parse.py
      render.py
      upload.py
    templates/
      entry_level_resume.tex.jinja
      jakes_resume.tex.jinja
      modern_resume.tex.jinja
      plush_cv.tex.jinja
      swe_template.tex.jinja
    __init__.py
    ai_client.py
    ai_prompts.py
    compiler.py
    config.py
    latex_utils.py
    main.py
    matcher.py
    requirements.txt
    resume_normalizer.py
    schema.py
    store.py
  tests/
    test_match.py
    test_parse.py
    test_render.py
  Dockerfile
compiler/
  Dockerfile
  run_compile.sh
ResumeKitty/
  app/
    about/
      page.tsx
    builder/
      page.tsx
    features/
      page.tsx
    help/
      page.tsx
    parser/
      page.tsx
    profile/
      page.tsx
    resumes/
      page.tsx
    settings/
      page.tsx
    globals.css
    layout.tsx
    page.tsx
  components/
    DownloadGateModal.tsx
    JsonEditorForm.tsx
    MasterDetailEditModal.tsx
    MatchAssistant.tsx
    Navbar.tsx
    PdfPreview.tsx
    ResumeParser.tsx
    StorySection.tsx
    UploadForm.tsx
  hooks/
    use-mobile.ts
  lib/
    utils.ts
  public/
    Cat_Video_Generation.mp4
    ChatGPT Image Mar 10, 2026, 01_21_34 AM.png
    ChatGPT Image Mar 10, 2026, 01_22_33 AM.png
    ChatGPT Image Mar 10, 2026, 01_30_28 AM.png
  types/
    builder.ts
    match.ts
    resume.ts
  .env.example
  .eslintrc.json
  .gitignore
  Dockerfile
  eslint.config.mjs
  metadata.json
  next-env.d.ts
  next.config.ts
  package.json
  postcss.config.mjs
  PRODUCT_ARCHITECTURE.md
  README.md
  tsconfig.json
.gitignore
docker-compose.yml
README.md
```

# Files

## File: backend/app/api/__init__.py
````python

````

## File: backend/app/api/health.py
````python
from __future__ import annotations

from fastapi import APIRouter


router = APIRouter()


@router.get("")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
````

## File: backend/app/api/match.py
````python
from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.matcher import match_resume_to_job
from app.schema import MatchRequest, MatchResponse


router = APIRouter()


@router.post("", response_model=MatchResponse)
async def match_resume(payload: MatchRequest) -> dict:
    if not payload.job_description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide a job description.",
        )

    try:
        return match_resume_to_job(payload.resume, payload.job_description)
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Match analysis failed: {error}",
        ) from error
````

## File: backend/app/api/parse.py
````python
from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.ai_client import parse_resume_text
from app.schema import ParseRequest
from app.store import get_text


router = APIRouter()


@router.post("")
async def parse_resume(payload: ParseRequest) -> dict:
    raw_text = (payload.text or "").strip()

    if not raw_text and payload.file_id:
        stored_text = get_text(payload.file_id)
        if not stored_text:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Unknown file_id.",
            )
        raw_text = stored_text

    if not raw_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either text or file_id.",
        )

    try:
        resume = parse_resume_text(raw_text)
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI parsing failed: {error}",
        ) from error

    return resume.model_dump(mode="json")
````

## File: backend/app/api/render.py
````python
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Response, status

from app.compiler import compile_latex_document, render_latex_template
from app.schema import RenderRequest


router = APIRouter()


@router.post("")
async def render_resume(payload: RenderRequest) -> Response:
    options = payload.options.model_copy(update={"template": payload.template})

    try:
        tex_source = render_latex_template(payload.resume, options)
        pdf_bytes = compile_latex_document(tex_source)
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Render failed: {error}",
        ) from error

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'inline; filename="resume.pdf"'},
    )
````

## File: backend/app/api/upload.py
````python
from __future__ import annotations

from io import BytesIO
from pathlib import Path

import pdfplumber
from docx import Document
from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.config import get_settings
from app.store import save_text


router = APIRouter()


def _extract_text_from_pdf(data: bytes) -> str:
    pages: list[str] = []
    with pdfplumber.open(BytesIO(data)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            if page_text.strip():
                pages.append(page_text.strip())
    return "\n\n".join(pages).strip()


def _extract_text_from_docx(data: bytes) -> str:
    document = Document(BytesIO(data))
    paragraphs = [paragraph.text.strip() for paragraph in document.paragraphs if paragraph.text.strip()]
    return "\n".join(paragraphs).strip()


def _extract_text_from_txt(data: bytes) -> str:
    for encoding in ("utf-8", "utf-8-sig", "latin-1"):
        try:
            return data.decode(encoding).strip()
        except UnicodeDecodeError:
            continue
    return data.decode("utf-8", errors="ignore").strip()


def _validate_upload(filename: str | None, size_bytes: int) -> str:
    settings = get_settings()
    extension = Path(filename or "").suffix.lower()
    if extension not in settings.allowed_upload_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{extension or 'unknown'}'.",
        )
    if size_bytes > settings.max_upload_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds {settings.max_upload_size_mb} MB limit.",
        )
    return extension


@router.post("")
async def upload_resume(file: UploadFile = File(...)) -> dict[str, str]:
    data = await file.read()
    extension = _validate_upload(file.filename, len(data))

    if extension == ".pdf":
        text = _extract_text_from_pdf(data)
    elif extension == ".txt":
        text = _extract_text_from_txt(data)
    else:
        text = _extract_text_from_docx(data)

    if not text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not extract readable text from the uploaded document.",
        )

    file_id = save_text(text)
    return {"file_id": file_id, "text": text}
````

## File: backend/app/templates/entry_level_resume.tex.jinja
````jinja
\documentclass[a4,\VAR{options.font_size}pt]{article}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{tabularx}
\usepackage[hidelinks]{hyperref}
\usepackage{enumitem}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{xcolor}
\usepackage[margin=\VAR{options.margin}, top=\VAR{options.margin}]{geometry}

\definecolor{UI_blue}{RGB}{32, 64, 151}
\pagestyle{empty}
\setlength{\parindent}{0pt}
\setlength{\parskip}{0.3em}

\titleformat{\section}{\color{UI_blue}\scshape\raggedright\large}{}{0em}{}[\vspace{-10pt}\hrulefill\vspace{-6pt}]
\titleformat{\subsection}{\bfseries\normalsize}{}{0em}{}
\newenvironment{zitemize}{\begin{itemize}[leftmargin=1.2em,itemsep=0.2em,topsep=0.2em]}{\end{itemize}}
\newcommand{\hskills}[1]{\textbf{#1}}

\begin{document}

\begin{center}
  \begin{minipage}[b]{0.24\textwidth}
    \small \VAR{resume.header.phone}\\
    \small \BLOCK{ if resume.header.email }\href{mailto:\VAR{resume.header.email}}{Email}\BLOCK{ endif }
  \end{minipage}%
  \begin{minipage}[b]{0.50\textwidth}
    \centering
    {\LARGE \VAR{resume.header.name}}\\
    {\color{UI_blue}\large \VAR{resume.header.title}}
  \end{minipage}%
  \begin{minipage}[b]{0.24\textwidth}
    \raggedleft\small
    \BLOCK{ if resume.header.linkedin }\href{\VAR{resume.header.linkedin}}{LinkedIn}\BLOCK{ endif }\\
    \BLOCK{ if resume.header.github }\href{\VAR{resume.header.github}}{GitHub}\BLOCK{ endif }\\
    \BLOCK{ if resume.header.website }\href{\VAR{resume.header.website}}{Website}\BLOCK{ endif }\\
    \BLOCK{ if resume.header.portfolio }\href{\VAR{resume.header.portfolio}}{Portfolio}\BLOCK{ endif }
  \end{minipage}
\vspace{-0.15cm}
{\color{UI_blue}\hrulefill}
\end{center}

\BLOCK{ if resume.skills }
\BLOCK{ if resume.skills and resume.skills[0] is string }
\BLOCK{ set skill_keywords = resume.skills[:4] }
\BLOCK{ else }
\BLOCK{ set skill_keywords = [] }
\BLOCK{ for group in resume.skills[:2] }
\BLOCK{ for skill in group["items"][:2] }
\BLOCK{ set _ = skill_keywords.append(skill) }
\BLOCK{ endfor }
\BLOCK{ endfor }
\BLOCK{ endif }
\BLOCK{ if skill_keywords }
\BLOCK{ for skill in skill_keywords[:4] }
\begin{minipage}[b]{0.25\textwidth}\textbullet\hspace{0.1cm}\VAR{skill}\end{minipage}\BLOCK{ endfor }
\BLOCK{ endif }
\BLOCK{ endif }

\BLOCK{ set section_order = options.section_order if options.section_order else [
  "summary",
  "skills",
  "education",
  "experience",
  "projects",
  "certifications",
  "awards",
  "leadership",
  "extracurricular"
] }

\BLOCK{ for section_key in section_order }

\BLOCK{ if section_key == "summary" and resume.summary }
\hskills{Impact:} \VAR{resume.summary}
\vspace{-0.2cm}
\BLOCK{ endif }

\BLOCK{ if section_key == "education" and resume.education }
\section{Education}
\BLOCK{ for item in resume.education }
\subsection*{\VAR{item.degree}\BLOCK{ if item.field }, \VAR{item.field}\BLOCK{ endif }, {\normalfont \VAR{item.institution}\BLOCK{ if item.gpa }, GPA: \VAR{item.gpa}\BLOCK{ endif }} \hfill \VAR{item.start_year}\BLOCK{ if item.end_year } --- \VAR{item.end_year}\BLOCK{ endif }}
\BLOCK{ endfor }
\vspace{0.1cm}
\BLOCK{ endif }

\BLOCK{ if section_key == "projects" and resume.projects }
\section{Projects}
\BLOCK{ for item in resume.projects }
\subsection*{\BLOCK{ if item.link }\href{\VAR{item.link}}{\VAR{item.title}}\BLOCK{ else }\VAR{item.title}\BLOCK{ endif }\BLOCK{ if item.technologies }, {\normalfont \VAR{item.technologies | join(", ")}}\BLOCK{ endif } \hfill \VAR{item.start_date | format_date_range(item.end_date)}}
\BLOCK{ if item.description }
\begin{zitemize}
\item \VAR{item.description}
\end{zitemize}
\BLOCK{ else }
\BLOCK{ set project_bullets = item.bullets[:options.max_bullets_per_job] | select | list }
\BLOCK{ if project_bullets }
\begin{zitemize}
\BLOCK{ for bullet in project_bullets }\item \VAR{bullet}\BLOCK{ endfor }
\end{zitemize}
\BLOCK{ endif }
\BLOCK{ endif }
\BLOCK{ endfor }
\BLOCK{ endif }

\BLOCK{ if section_key == "experience" and resume.experience }
\section{Experience}
\BLOCK{ for item in resume.experience }
\subsection*{\VAR{item.role}\BLOCK{ if item.company }, {\normalfont \VAR{item.company}}\BLOCK{ endif } \hfill \VAR{item.start_date | format_date_range(item.end_date, item.current)}}
\small \VAR{item.location}\par
\BLOCK{ if item.description }
\par \small \VAR{item.description}\par
\BLOCK{ else }
\BLOCK{ set exp_bullets = item.bullets[:options.max_bullets_per_job] | select | list }
\BLOCK{ if exp_bullets }
\begin{zitemize}
\BLOCK{ for bullet in exp_bullets }
\item \VAR{bullet}
\BLOCK{ endfor }
\end{zitemize}
\BLOCK{ endif }
\BLOCK{ endif }
\BLOCK{ endfor }
\BLOCK{ endif }

\BLOCK{ if section_key == "skills" and resume.skills }
\section{Skills}
\begin{tabular}{p{7em} p{48em}}
\BLOCK{ if resume.skills and resume.skills[0] is string }
\hskills{Skills} & \VAR{resume.skills | join(", ")} \\
\BLOCK{ else }
\BLOCK{ for group in resume.skills }
\hskills{\VAR{group.category}} & \VAR{group["items"] | join(", ")} \\
\BLOCK{ endfor }
\BLOCK{ endif }
\end{tabular}
\BLOCK{ endif }

\BLOCK{ if section_key == "certifications" and resume.certifications }
\section{Certifications}
\begin{itemize}[leftmargin=1.2em,itemsep=0.2em]
\BLOCK{ for item in resume.certifications }
\item \BLOCK{ if item.link }\href{\VAR{item.link}}{\VAR{item.description}}\BLOCK{ else }\VAR{item.description}\BLOCK{ endif }\BLOCK{ if item.date } (\VAR{item.date | format_month_year})\BLOCK{ endif }
\BLOCK{ endfor }
\end{itemize}
\BLOCK{ endif }

\BLOCK{ if section_key == "awards" and resume.awards }
\section{Awards \& Honors}
\begin{itemize}[leftmargin=1.2em,itemsep=0.2em]
\BLOCK{ for item in resume.awards }
\item \BLOCK{ if item.link }\href{\VAR{item.link}}{\VAR{item.description}}\BLOCK{ else }\VAR{item.description}\BLOCK{ endif }\BLOCK{ if item.date } (\VAR{item.date | format_month_year})\BLOCK{ endif }
\BLOCK{ endfor }
\end{itemize}
\BLOCK{ endif }

\BLOCK{ if section_key == "leadership" and resume.leadership }
\section{Leadership | Roles \& Responsibilities}
\begin{itemize}[leftmargin=1.2em,itemsep=0.2em]
\BLOCK{ for item in resume.leadership }
\item \BLOCK{ if item.link }\href{\VAR{item.link}}{\VAR{item.description}}\BLOCK{ else }\VAR{item.description}\BLOCK{ endif }\BLOCK{ if item.date } (\VAR{item.date | format_month_year})\BLOCK{ endif }
\BLOCK{ endfor }
\end{itemize}
\BLOCK{ endif }

\BLOCK{ if section_key == "extracurricular" and resume.extracurricular }
\section{Extracurricular Activities}
\begin{itemize}[leftmargin=1.2em,itemsep=0.2em]
\BLOCK{ for item in resume.extracurricular }
\item \BLOCK{ if item.link }\href{\VAR{item.link}}{\VAR{item.description}}\BLOCK{ else }\VAR{item.description}\BLOCK{ endif }\BLOCK{ if item.date } (\VAR{item.date | format_month_year})\BLOCK{ endif }
\BLOCK{ endfor }
\end{itemize}
\BLOCK{ endif }

\BLOCK{ endfor }

\end{document}
````

## File: backend/app/templates/jakes_resume.tex.jinja
````jinja
\documentclass[letterpaper,\VAR{options.font_size}pt]{article}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{xcolor}

\pagestyle{fancy}
\fancyhf{}
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}
\addtolength{\oddsidemargin}{-0.5in}
\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1in}
\addtolength{\topmargin}{-.5in}
\addtolength{\textheight}{1.0in}
\setlength{\tabcolsep}{0in}
\raggedbottom
\raggedright

\titleformat{\section}{\vspace{-4pt}\scshape\raggedright\large}{}{0em}{}[\color{black}\titlerule \vspace{-5pt}]

\newcommand{\resumeItem}[1]{\item\small{{#1 \vspace{-2pt}}}}
\newcommand{\resumeSubheading}[4]{
  \vspace{-2pt}\item
    \begin{tabular*}{0.97\textwidth}[t]{l@{\extracolsep{\fill}}r}
      \textbf{#1} & #2 \\
      \textit{\small#3} & \textit{\small #4} \\
    \end{tabular*}\vspace{-7pt}
}
\newcommand{\resumeProjectHeading}[2]{
  \item
    \begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
      \small#1 & #2 \\
    \end{tabular*}\vspace{-7pt}
}
\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.15in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\newcommand{\resumeItemListStart}{\begin{itemize}[leftmargin=1.6em]}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-5pt}}

\begin{document}

\begin{center}
  {\Huge \scshape \VAR{resume.header.name}} \\ \vspace{1pt}
  \small
  \BLOCK{ set contact_parts = [] }
  \BLOCK{ if resume.header.phone }\BLOCK{ set _ = contact_parts.append(resume.header.phone) }\BLOCK{ endif }
  \BLOCK{ if resume.header.email }\BLOCK{ set _ = contact_parts.append("\\href{mailto:" ~ resume.header.email ~ "}{Email}") }\BLOCK{ endif }
  \BLOCK{ if resume.header.linkedin }\BLOCK{ set _ = contact_parts.append("\\href{" ~ resume.header.linkedin ~ "}{LinkedIn}") }\BLOCK{ endif }
  \BLOCK{ if resume.header.github }\BLOCK{ set _ = contact_parts.append("\\href{" ~ resume.header.github ~ "}{GitHub}") }\BLOCK{ endif }
  \BLOCK{ if resume.header.website }\BLOCK{ set _ = contact_parts.append("\\href{" ~ resume.header.website ~ "}{Website}") }\BLOCK{ endif }
  \BLOCK{ if resume.header.portfolio }\BLOCK{ set _ = contact_parts.append("\\href{" ~ resume.header.portfolio ~ "}{Portfolio}") }\BLOCK{ endif }
  \BLOCK{ if resume.header.location }\BLOCK{ set _ = contact_parts.append(resume.header.location) }\BLOCK{ endif }
  \VAR{contact_parts | join(" $|$ ")}
\end{center}

\BLOCK{ set section_order = options.section_order if options.section_order else [
  "summary",
  "skills",
  "education",
  "experience",
  "projects",
  "certifications",
  "awards",
  "leadership",
  "extracurricular"
] }

\BLOCK{ for section_key in section_order }

\BLOCK{ if section_key == "summary" and resume.summary }
\section{Summary}
\small \VAR{resume.summary}
\BLOCK{ endif }

\BLOCK{ if section_key == "education" and resume.education }
\section{Education}
\resumeSubHeadingListStart
\BLOCK{ for item in resume.education }
  \resumeSubheading
    {\VAR{item.institution}}
    {\VAR{item.location}}
    {\VAR{item.degree}\BLOCK{ if item.field } in \VAR{item.field}\BLOCK{ endif }\BLOCK{ if item.gpa }, GPA: \VAR{item.gpa}\BLOCK{ endif }}
    {\BLOCK{ if item.start_year }\VAR{item.start_year}\BLOCK{ endif }\BLOCK{ if item.end_year } -- \VAR{item.end_year}\BLOCK{ endif }}
\BLOCK{ endfor }
\resumeSubHeadingListEnd
\BLOCK{ endif }

\BLOCK{ if section_key == "experience" and resume.experience }
\section{Experience}
\resumeSubHeadingListStart
\BLOCK{ for item in resume.experience }
  \resumeSubheading
    {\VAR{item.role}}
    {\VAR{item.start_date | format_date_range(item.end_date, item.current)}}
    {\VAR{item.company}}
    {\VAR{item.location}}
  \BLOCK{ if item.description }\par \small \VAR{item.description}\par\BLOCK{ endif }
  \BLOCK{ if not item.description }
  \BLOCK{ set exp_bullets = item.bullets[:options.max_bullets_per_job] | select | list }
  \BLOCK{ if exp_bullets }
  \resumeItemListStart
    \BLOCK{ for bullet in exp_bullets }
    \resumeItem{\VAR{bullet}}
    \BLOCK{ endfor }
  \resumeItemListEnd
  \BLOCK{ endif }
  \BLOCK{ endif }
\BLOCK{ endfor }
\resumeSubHeadingListEnd
\BLOCK{ endif }

\BLOCK{ if section_key == "projects" and resume.projects }
\section{Projects}
\resumeSubHeadingListStart
\BLOCK{ for item in resume.projects }
  \resumeProjectHeading
    {\textbf{\BLOCK{ if item.link }\href{\VAR{item.link}}{\VAR{item.title}}\BLOCK{ else }\VAR{item.title}\BLOCK{ endif }}\BLOCK{ if item.technologies } $|$ \emph{\VAR{item.technologies | join(", ")}}\BLOCK{ endif }}
    {\VAR{item.start_date | format_date_range(item.end_date)}}
  \BLOCK{ if item.description }\small \VAR{item.description}\par\BLOCK{ endif }
  \BLOCK{ if not item.description }
  \BLOCK{ set project_bullets = item.bullets | select | list }
  \BLOCK{ if project_bullets }
  \resumeItemListStart
    \BLOCK{ for bullet in project_bullets[:options.max_bullets_per_job] }
    \resumeItem{\VAR{bullet}}
    \BLOCK{ endfor }
  \resumeItemListEnd
  \BLOCK{ endif }
  \BLOCK{ endif }
\BLOCK{ endfor }
\resumeSubHeadingListEnd
\BLOCK{ endif }

\BLOCK{ if section_key == "skills" and resume.skills }
\section{Technical Skills}
\begin{itemize}[leftmargin=0.15in, label={}]
  \small{
  \item{
    \BLOCK{ if resume.skills and resume.skills[0] is string }
    \textbf{Skills}: \VAR{resume.skills | join(", ")}
    \BLOCK{ else }
    \BLOCK{ for skill_group in resume.skills }
    \textbf{\VAR{skill_group.category}}: \VAR{skill_group["items"] | join(", ")}\BLOCK{ if not loop.last } \\\BLOCK{ endif }
    \BLOCK{ endfor }
    \BLOCK{ endif }
  }}
\end{itemize}
\BLOCK{ endif }

\BLOCK{ if section_key == "certifications" and resume.certifications }
\section{Certifications}
\begin{itemize}[leftmargin=1.6em]
\BLOCK{ for item in resume.certifications }
  \item \small \BLOCK{ if item.link }\href{\VAR{item.link}}{\VAR{item.description}}\BLOCK{ else }\VAR{item.description}\BLOCK{ endif }\BLOCK{ if item.date } (\VAR{item.date | format_month_year})\BLOCK{ endif }
\BLOCK{ endfor }
\end{itemize}
\BLOCK{ endif }

\BLOCK{ if section_key == "awards" and resume.awards }
\section{Achievements / Awards}
\begin{itemize}[leftmargin=1.6em]
\BLOCK{ for item in resume.awards }
  \item \small \BLOCK{ if item.link }\href{\VAR{item.link}}{\VAR{item.description}}\BLOCK{ else }\VAR{item.description}\BLOCK{ endif }\BLOCK{ if item.date } (\VAR{item.date | format_month_year})\BLOCK{ endif }
\BLOCK{ endfor }
\end{itemize}
\BLOCK{ endif }

\BLOCK{ if section_key == "leadership" and resume.leadership }
\section{Leadership | Roles \& Responsibilities}
\begin{itemize}[leftmargin=1.6em]
\BLOCK{ for item in resume.leadership }
  \item \small \BLOCK{ if item.link }\href{\VAR{item.link}}{\VAR{item.description}}\BLOCK{ else }\VAR{item.description}\BLOCK{ endif }\BLOCK{ if item.date } (\VAR{item.date | format_month_year})\BLOCK{ endif }
\BLOCK{ endfor }
\end{itemize}
\BLOCK{ endif }

\BLOCK{ if section_key == "extracurricular" and resume.extracurricular }
\section{Extracurricular Activities}
\begin{itemize}[leftmargin=1.6em]
\BLOCK{ for item in resume.extracurricular }
  \item \small \BLOCK{ if item.link }\href{\VAR{item.link}}{\VAR{item.description}}\BLOCK{ else }\VAR{item.description}\BLOCK{ endif }\BLOCK{ if item.date } (\VAR{item.date | format_month_year})\BLOCK{ endif }
\BLOCK{ endfor }
\end{itemize}
\BLOCK{ endif }

\BLOCK{ endfor }

\end{document}
````

## File: backend/app/templates/modern_resume.tex.jinja
````jinja
\documentclass[\VAR{options.font_size}pt]{article}
\usepackage[margin=\VAR{options.margin}]{geometry}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage[hidelinks]{hyperref}
\usepackage{enumitem}
\usepackage{textcomp}
\usepackage{xcolor}
\pagestyle{empty}
\setlength{\parindent}{0pt}
\setlength{\parskip}{0.35em}
\definecolor{heading}{HTML}{16324F}
\definecolor{accent}{HTML}{235789}

\newcommand{\sectionline}[1]{
  \vspace{0.4em}
  {\large\bfseries\color{heading} #1}\par
  \vspace{0.2em}
  \hrule
  \vspace{0.4em}
}

\begin{document}

{\LARGE\bfseries \VAR{resume.header.name}}\par
\BLOCK{ if resume.header.title }{\large\color{accent} \VAR{resume.header.title}}\par\BLOCK{ endif }

\BLOCK{ set contact_parts = [] }
\BLOCK{ if resume.header.email }\BLOCK{ set _ = contact_parts.append("\\href{mailto:" ~ resume.header.email ~ "}{Email}") }\BLOCK{ endif }
\BLOCK{ if resume.header.phone }\BLOCK{ set _ = contact_parts.append(resume.header.phone) }\BLOCK{ endif }
\BLOCK{ if resume.header.location }\BLOCK{ set _ = contact_parts.append(resume.header.location) }\BLOCK{ endif }
\BLOCK{ if resume.header.linkedin }\BLOCK{ set _ = contact_parts.append("\\href{" ~ resume.header.linkedin ~ "}{LinkedIn}") }\BLOCK{ endif }
\BLOCK{ if resume.header.github }\BLOCK{ set _ = contact_parts.append("\\href{" ~ resume.header.github ~ "}{GitHub}") }\BLOCK{ endif }
\BLOCK{ if resume.header.website }\BLOCK{ set _ = contact_parts.append("\\href{" ~ resume.header.website ~ "}{Website}") }\BLOCK{ endif }
\BLOCK{ if resume.header.portfolio }\BLOCK{ set _ = contact_parts.append("\\href{" ~ resume.header.portfolio ~ "}{Portfolio}") }\BLOCK{ endif }
\BLOCK{ if contact_parts }
\small \VAR{contact_parts | join(" $\\vert$ ")}\par
\BLOCK{ endif }

\BLOCK{ set section_order = options.section_order if options.section_order else [
  "summary",
  "skills",
  "education",
  "experience",
  "projects",
  "certifications",
  "awards",
  "leadership",
  "extracurricular"
] }

\BLOCK{ for section_key in section_order }

\BLOCK{ if section_key == "summary" and resume.summary }
\sectionline{Summary}
\VAR{resume.summary}\par
\BLOCK{ endif }

\BLOCK{ if section_key == "skills" and resume.skills }
\sectionline{Skills}
\BLOCK{ if resume.skills and resume.skills[0] is string }
\VAR{resume.skills | join(", ")}\par
\BLOCK{ else }
\BLOCK{ for skill_group in resume.skills }
{\bfseries \VAR{skill_group.category}:} \VAR{skill_group["items"] | join(", ")}\par
\BLOCK{ endfor }
\BLOCK{ endif }
\BLOCK{ endif }

\BLOCK{ if section_key == "education" and resume.education }
\sectionline{Education}
\BLOCK{ for item in resume.education }
{\bfseries \VAR{item.degree}}\BLOCK{ if item.field } in \VAR{item.field}\BLOCK{ endif }\hfill
\BLOCK{ set years = [] }
\BLOCK{ if item.start_year }\BLOCK{ set _ = years.append(item.start_year) }\BLOCK{ endif }
\BLOCK{ if item.end_year }\BLOCK{ set _ = years.append(item.end_year) }\BLOCK{ endif }
\VAR{years | join(" -- ")}\par
\VAR{item.institution}\BLOCK{ if item.location } | \VAR{item.location}\BLOCK{ endif }\par
\BLOCK{ if item.gpa }GPA: \VAR{item.gpa}\par\BLOCK{ endif }
\BLOCK{ endfor }
\BLOCK{ endif }

\BLOCK{ if section_key == "experience" and resume.experience }
\sectionline{Experience}
\BLOCK{ for item in resume.experience }
{\bfseries \VAR{item.role}}\BLOCK{ if item.company } | \VAR{item.company}\BLOCK{ endif }\hfill
\VAR{item.start_date | format_date_range(item.end_date, item.current)}\par
\BLOCK{ if item.location }{\small \VAR{item.location}}\par\BLOCK{ endif }
\BLOCK{ if item.description }\VAR{item.description}\par\BLOCK{ endif }
\BLOCK{ if not item.description }
\BLOCK{ set exp_bullets = item.bullets[:options.max_bullets_per_job] | select | list }
\BLOCK{ if exp_bullets }
\begin{itemize}[leftmargin=1.2em,topsep=0.15em,itemsep=0.2em]
\BLOCK{ for bullet in exp_bullets }
\item \VAR{bullet}
\BLOCK{ endfor }
\end{itemize}
\BLOCK{ endif }
\BLOCK{ endif }
\BLOCK{ endfor }
\BLOCK{ endif }

\BLOCK{ if section_key == "projects" and resume.projects }
\sectionline{Projects}
\BLOCK{ for item in resume.projects }
\BLOCK{ set project_range = item.start_date | format_date_range(item.end_date) }
{\bfseries \BLOCK{ if item.link }\href{\VAR{item.link}}{\VAR{item.title}}\BLOCK{ else }\VAR{item.title}\BLOCK{ endif }}\BLOCK{ if project_range } \hfill \VAR{project_range}\BLOCK{ endif }\par
\BLOCK{ if item.description }\VAR{item.description}\par\BLOCK{ endif }
\BLOCK{ if item.technologies }{\small Technologies: \VAR{item.technologies | join(", ")}}\par\BLOCK{ endif }
\BLOCK{ if not item.description }
\BLOCK{ set project_bullets = item.bullets[:options.max_bullets_per_job] | select | list }
\BLOCK{ if project_bullets }
\begin{itemize}[leftmargin=1.2em,topsep=0.15em,itemsep=0.2em]
\BLOCK{ for bullet in project_bullets }
\item \VAR{bullet}
\BLOCK{ endfor }
\end{itemize}
\BLOCK{ endif }
\BLOCK{ endif }
\BLOCK{ endfor }
\BLOCK{ endif }

\BLOCK{ if section_key == "certifications" and resume.certifications }
\sectionline{Certifications}
\begin{itemize}[leftmargin=1.2em,topsep=0.15em,itemsep=0.2em]
\BLOCK{ for item in resume.certifications }
\item \BLOCK{ if item.link }\href{\VAR{item.link}}{\VAR{item.description}}\BLOCK{ else }\VAR{item.description}\BLOCK{ endif }\BLOCK{ if item.date } (\VAR{item.date | format_month_year})\BLOCK{ endif }
\BLOCK{ endfor }
\end{itemize}
\BLOCK{ endif }

\BLOCK{ if section_key == "awards" and resume.awards }
\sectionline{Achievements / Awards}
\begin{itemize}[leftmargin=1.2em,topsep=0.15em,itemsep=0.2em]
\BLOCK{ for item in resume.awards }
\item \BLOCK{ if item.link }\href{\VAR{item.link}}{\VAR{item.description}}\BLOCK{ else }\VAR{item.description}\BLOCK{ endif }\BLOCK{ if item.date } (\VAR{item.date | format_month_year})\BLOCK{ endif }
\BLOCK{ endfor }
\end{itemize}
\BLOCK{ endif }

\BLOCK{ if section_key == "leadership" and resume.leadership }
\sectionline{Leadership | Roles \& Responsibilities}
\begin{itemize}[leftmargin=1.2em,topsep=0.15em,itemsep=0.2em]
\BLOCK{ for item in resume.leadership }
\item \BLOCK{ if item.link }\href{\VAR{item.link}}{\VAR{item.description}}\BLOCK{ else }\VAR{item.description}\BLOCK{ endif }\BLOCK{ if item.date } (\VAR{item.date | format_month_year})\BLOCK{ endif }
\BLOCK{ endfor }
\end{itemize}
\BLOCK{ endif }

\BLOCK{ if section_key == "extracurricular" and resume.extracurricular }
\sectionline{Extracurricular Activities}
\begin{itemize}[leftmargin=1.2em,topsep=0.15em,itemsep=0.2em]
\BLOCK{ for item in resume.extracurricular }
\item \BLOCK{ if item.link }\href{\VAR{item.link}}{\VAR{item.description}}\BLOCK{ else }\VAR{item.description}\BLOCK{ endif }\BLOCK{ if item.date } (\VAR{item.date | format_month_year})\BLOCK{ endif }
\BLOCK{ endfor }
\end{itemize}
\BLOCK{ endif }

\BLOCK{ endfor }

\end{document}
````

## File: backend/app/templates/plush_cv.tex.jinja
````jinja
\documentclass[\VAR{options.font_size}pt]{article}
\usepackage[margin=\VAR{options.margin}]{geometry}
\usepackage{fancyhdr}
\usepackage[hidelinks]{hyperref}
\usepackage{enumitem}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{xcolor}

\pagestyle{fancy}
\fancyhf{}
\renewcommand{\headrulewidth}{0pt}
\setlength{\parindent}{0pt}
\setlength{\parskip}{0.25em}

\definecolor{plushaccent}{HTML}{2F4858}
\newcommand{\sectionsep}{\vspace{0.6em}}
\newcommand{\runsubsection}[1]{{\large\bfseries #1}}
\newcommand{\descript}[1]{{\color{plushaccent}\small #1}}
\newcommand{\location}[1]{{\small\itshape #1}}
\newenvironment{tightemize}{\begin{itemize}[leftmargin=1.2em,itemsep=0.15em,topsep=0.15em]}{\end{itemize}}

\begin{document}

{\huge \textbf{\VAR{resume.header.name}}} \hfill {\large \VAR{resume.header.title}} \\
\small
\BLOCK{ set contact_parts = [] }
\BLOCK{ if resume.header.website }\BLOCK{ set _ = contact_parts.append("\\href{" ~ resume.header.website ~ "}{Website}") }\BLOCK{ endif }
\BLOCK{ if resume.header.portfolio }\BLOCK{ set _ = contact_parts.append("\\href{" ~ resume.header.portfolio ~ "}{Portfolio}") }\BLOCK{ endif }
\BLOCK{ if resume.header.github }\BLOCK{ set _ = contact_parts.append("\\href{" ~ resume.header.github ~ "}{GitHub}") }\BLOCK{ endif }
\BLOCK{ if resume.header.linkedin }\BLOCK{ set _ = contact_parts.append("\\href{" ~ resume.header.linkedin ~ "}{LinkedIn}") }\BLOCK{ endif }
\BLOCK{ if resume.header.email }\BLOCK{ set _ = contact_parts.append("\\href{mailto:" ~ resume.header.email ~ "}{Email}") }\BLOCK{ endif }
\BLOCK{ if resume.header.phone }\BLOCK{ set _ = contact_parts.append(resume.header.phone) }\BLOCK{ endif }
\VAR{contact_parts | join("  |  ")}
\vspace{0.6em}
\hrule
\vspace{0.8em}

\begin{minipage}[t]{0.70\textwidth}
\BLOCK{ set section_order = options.section_order if options.section_order else [
  "summary",
  "skills",
  "education",
  "experience",
  "projects",
  "certifications",
  "awards",
  "leadership",
  "extracurricular"
] }

\BLOCK{ for section_key in section_order }

\BLOCK{ if section_key == "summary" and resume.summary }
\section*{Summary}
\VAR{resume.summary}
\sectionsep
\BLOCK{ endif }

\BLOCK{ if section_key == "experience" and resume.experience }
\section*{Experience}
\BLOCK{ for item in resume.experience }
\runsubsection{\VAR{item.company}}\\
\descript{| \VAR{item.role}}\\
\location{\VAR{item.start_date | format_date_range(item.end_date, item.current)}\BLOCK{ if item.location } | \VAR{item.location}\BLOCK{ endif }}
\BLOCK{ if item.description }\par \small \VAR{item.description}\par\BLOCK{ endif }
\BLOCK{ if not item.description }
\BLOCK{ set exp_bullets = item.bullets[:options.max_bullets_per_job] | select | list }
\BLOCK{ if exp_bullets }
\begin{tightemize}
\BLOCK{ for bullet in exp_bullets }
\item \VAR{bullet}
\BLOCK{ endfor }
\end{tightemize}
\BLOCK{ endif }
\BLOCK{ endif }
\sectionsep
\BLOCK{ endfor }
\BLOCK{ endif }

\BLOCK{ if section_key == "projects" and resume.projects }
\section*{Projects}
\BLOCK{ for item in resume.projects }
\runsubsection{\BLOCK{ if item.link }\href{\VAR{item.link}}{\VAR{item.title}}\BLOCK{ else }\VAR{item.title}\BLOCK{ endif }}\\
\descript{| \VAR{item.technologies | join(", ")}}\BLOCK{ if item.start_date or item.end_date } \hfill \location{\VAR{item.start_date | format_date_range(item.end_date)}}\BLOCK{ endif }\\
\BLOCK{ if item.description }
\begin{tightemize}
\item \VAR{item.description}
\end{tightemize}
\BLOCK{ else }
\BLOCK{ set project_bullets = item.bullets[:options.max_bullets_per_job] | select | list }
\BLOCK{ if project_bullets }
\begin{tightemize}
\BLOCK{ for bullet in project_bullets }
\item \VAR{bullet}
\BLOCK{ endfor }
\end{tightemize}
\BLOCK{ endif }
\BLOCK{ endif }
\sectionsep
\BLOCK{ endfor }
\BLOCK{ endif }

\BLOCK{ if section_key == "awards" and resume.awards }
\section*{Awards}
\begin{tightemize}
\BLOCK{ for item in resume.awards }
\item \BLOCK{ if item.link }\href{\VAR{item.link}}{\VAR{item.description}}\BLOCK{ else }\VAR{item.description}\BLOCK{ endif }\BLOCK{ if item.date } (\VAR{item.date | format_month_year})\BLOCK{ endif }
\BLOCK{ endfor }
\end{tightemize}
\BLOCK{ endif }

\BLOCK{ if section_key == "leadership" and resume.leadership }
\section*{Leadership | Roles \& Responsibilities}
\begin{tightemize}
\BLOCK{ for item in resume.leadership }
\item \BLOCK{ if item.link }\href{\VAR{item.link}}{\VAR{item.description}}\BLOCK{ else }\VAR{item.description}\BLOCK{ endif }\BLOCK{ if item.date } (\VAR{item.date | format_month_year})\BLOCK{ endif }
\BLOCK{ endfor }
\end{tightemize}
\BLOCK{ endif }

\BLOCK{ if section_key == "extracurricular" and resume.extracurricular }
\section*{Extracurricular Activities}
\begin{tightemize}
\BLOCK{ for item in resume.extracurricular }
\item \BLOCK{ if item.link }\href{\VAR{item.link}}{\VAR{item.description}}\BLOCK{ else }\VAR{item.description}\BLOCK{ endif }\BLOCK{ if item.date } (\VAR{item.date | format_month_year})\BLOCK{ endif }
\BLOCK{ endfor }
\end{tightemize}
\BLOCK{ endif }

\BLOCK{ endfor }
\end{minipage}
\hfill
\begin{minipage}[t]{0.27\textwidth}

\BLOCK{ for section_key in section_order }
\BLOCK{ if section_key == "skills" and resume.skills }
\section*{Skills}
\BLOCK{ if resume.skills and resume.skills[0] is string }
\VAR{resume.skills | join(" \\textbullet{} ")}
\BLOCK{ else }
\BLOCK{ for group in resume.skills }
\textbf{\VAR{group.category}}\\
\VAR{group["items"] | join(" \\textbullet{} ")}\\
\sectionsep
\BLOCK{ endfor }
\BLOCK{ endif }
\sectionsep
\BLOCK{ endif }

\BLOCK{ if section_key == "education" and resume.education }
\section*{Education}
\BLOCK{ for item in resume.education }
\textbf{\VAR{item.institution}}\\
\descript{\VAR{item.degree}\BLOCK{ if item.field }, \VAR{item.field}\BLOCK{ endif }}\\
\location{\VAR{item.start_year}\BLOCK{ if item.end_year } -- \VAR{item.end_year}\BLOCK{ endif }\BLOCK{ if item.location } | \VAR{item.location}\BLOCK{ endif }}\\
\BLOCK{ if item.gpa }\location{GPA: \VAR{item.gpa}}\BLOCK{ endif }
\sectionsep
\BLOCK{ endfor }
\BLOCK{ endif }

\BLOCK{ if section_key == "certifications" and resume.certifications }
\section*{Certifications}
\begin{tightemize}
\BLOCK{ for item in resume.certifications }
\item \BLOCK{ if item.link }\href{\VAR{item.link}}{\VAR{item.description}}\BLOCK{ else }\VAR{item.description}\BLOCK{ endif }\BLOCK{ if item.date } (\VAR{item.date | format_month_year})\BLOCK{ endif }
\BLOCK{ endfor }
\end{tightemize}
\BLOCK{ endif }
\BLOCK{ endfor }

\end{minipage}
\end{document}
````

## File: backend/app/templates/swe_template.tex.jinja
````jinja
\documentclass[letterpaper,\VAR{options.font_size}pt]{article}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{xcolor}

\pagestyle{fancy}
\fancyhf{}
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}
\addtolength{\oddsidemargin}{-0.5in}
\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1in}
\addtolength{\topmargin}{-.5in}
\addtolength{\textheight}{1.0in}
\setlength{\tabcolsep}{0in}
\raggedbottom
\raggedright

\titleformat{\section}{\vspace{-4pt}\scshape\raggedright\large}{}{0em}{}[\color{black}\titlerule\vspace{-5pt}]

\newcommand{\resumeItem}[1]{\item\small{{#1 \vspace{-2pt}}}}
\newcommand{\resumeSubheading}[4]{
  \vspace{-2pt}\item
  \begin{tabular*}{0.97\textwidth}[t]{l@{\extracolsep{\fill}}r}
    \textbf{#1} & #2 \\
    \textit{\small#3} & \textit{\small #4} \\
  \end{tabular*}\vspace{-7pt}
}
\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.15in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\newcommand{\resumeItemListStart}{\begin{itemize}[leftmargin=1.6em]}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-5pt}}

\begin{document}

\begin{center}
  {\Large \textbf{\VAR{resume.header.name}}} \\
  \small
  \BLOCK{ set header_parts = [] }
  \BLOCK{ if resume.header.title }\BLOCK{ set _ = header_parts.append(resume.header.title) }\BLOCK{ endif }
  \BLOCK{ if resume.header.email }\BLOCK{ set _ = header_parts.append("\\href{mailto:" ~ resume.header.email ~ "}{Email}") }\BLOCK{ endif }
  \BLOCK{ if resume.header.phone }\BLOCK{ set _ = header_parts.append(resume.header.phone) }\BLOCK{ endif }
  \BLOCK{ if resume.header.location }\BLOCK{ set _ = header_parts.append(resume.header.location) }\BLOCK{ endif }
  \BLOCK{ if resume.header.linkedin }\BLOCK{ set _ = header_parts.append("\\href{" ~ resume.header.linkedin ~ "}{LinkedIn}") }\BLOCK{ endif }
  \BLOCK{ if resume.header.github }\BLOCK{ set _ = header_parts.append("\\href{" ~ resume.header.github ~ "}{GitHub}") }\BLOCK{ endif }
  \BLOCK{ if resume.header.website }\BLOCK{ set _ = header_parts.append("\\href{" ~ resume.header.website ~ "}{Website}") }\BLOCK{ endif }
  \BLOCK{ if resume.header.portfolio }\BLOCK{ set _ = header_parts.append("\\href{" ~ resume.header.portfolio ~ "}{Portfolio}") }\BLOCK{ endif }
  \VAR{header_parts | join(" $|$ ")}
\end{center}

\BLOCK{ set section_order = options.section_order if options.section_order else [
  "summary",
  "skills",
  "education",
  "experience",
  "projects",
  "certifications",
  "awards",
  "leadership",
  "extracurricular"
] }

\BLOCK{ for section_key in section_order }

\BLOCK{ if section_key == "summary" and resume.summary }
\section{Summary}
\small \VAR{resume.summary}
\BLOCK{ endif }

\BLOCK{ if section_key == "experience" and resume.experience }
\section{Experience}
\resumeSubHeadingListStart
\BLOCK{ for item in resume.experience }
\resumeSubheading
  {\VAR{item.company}}
  {\VAR{item.start_date | format_date_range(item.end_date, item.current)}}
  {\VAR{item.role}}
  {\VAR{item.location}}
\BLOCK{ if item.description }\par \small \VAR{item.description}\par\BLOCK{ endif }
\BLOCK{ if not item.description }
\BLOCK{ set exp_bullets = item.bullets[:options.max_bullets_per_job] | select | list }
\BLOCK{ if exp_bullets }
\resumeItemListStart
\BLOCK{ for bullet in exp_bullets }
\resumeItem{\VAR{bullet}}
\BLOCK{ endfor }
\resumeItemListEnd
\BLOCK{ endif }
\BLOCK{ endif }
\BLOCK{ endfor }
\resumeSubHeadingListEnd
\BLOCK{ endif }

\BLOCK{ if section_key == "education" and resume.education }
\section{Education}
\resumeSubHeadingListStart
\BLOCK{ for item in resume.education }
\resumeSubheading
  {\VAR{item.institution}}
  {\VAR{item.start_year}\BLOCK{ if item.end_year } -- \VAR{item.end_year}\BLOCK{ endif }}
  {\VAR{item.degree}\BLOCK{ if item.field } in \VAR{item.field}\BLOCK{ endif }}
  {\VAR{item.location}\BLOCK{ if item.gpa }, GPA: \VAR{item.gpa}\BLOCK{ endif }}
\BLOCK{ endfor }
\resumeSubHeadingListEnd
\BLOCK{ endif }

\BLOCK{ if section_key == "projects" and resume.projects }
\section{Projects}
\resumeSubHeadingListStart
\BLOCK{ for item in resume.projects }
\resumeSubheading
  {\BLOCK{ if item.link }\href{\VAR{item.link}}{\VAR{item.title}}\BLOCK{ else }\VAR{item.title}\BLOCK{ endif }}
  {\VAR{item.start_date | format_date_range(item.end_date)}}
  {\VAR{item.technologies | join(", ")}}
  {}
\BLOCK{ if item.description }\small \VAR{item.description}\par\BLOCK{ endif }
\BLOCK{ if not item.description }
\BLOCK{ set project_bullets = item.bullets[:options.max_bullets_per_job] | select | list }
\BLOCK{ if project_bullets }
\resumeItemListStart
\BLOCK{ for bullet in project_bullets }
\resumeItem{\VAR{bullet}}
\BLOCK{ endfor }
\resumeItemListEnd
\BLOCK{ endif }
\BLOCK{ endif }
\BLOCK{ endfor }
\resumeSubHeadingListEnd
\BLOCK{ endif }

\BLOCK{ if section_key == "skills" and resume.skills }
\section{Skills}
\begin{itemize}[leftmargin=0.15in, label={}]
\small{\item{
\BLOCK{ if resume.skills and resume.skills[0] is string }
\textbf{Technical Skills}: \VAR{resume.skills | join(", ")}
\BLOCK{ else }
\BLOCK{ for group in resume.skills }
\textbf{\VAR{group.category}}: \VAR{group["items"] | join(", ")}\BLOCK{ if not loop.last } \\\BLOCK{ endif }
\BLOCK{ endfor }
\BLOCK{ endif }
}}
\end{itemize}
\BLOCK{ endif }

\BLOCK{ if section_key == "certifications" and resume.certifications }
\section{Certifications}
\begin{itemize}[leftmargin=1.6em]
\BLOCK{ for item in resume.certifications }
\item \small \BLOCK{ if item.link }\href{\VAR{item.link}}{\VAR{item.description}}\BLOCK{ else }\VAR{item.description}\BLOCK{ endif }\BLOCK{ if item.date } (\VAR{item.date | format_month_year})\BLOCK{ endif }
\BLOCK{ endfor }
\end{itemize}
\BLOCK{ endif }

\BLOCK{ if section_key == "awards" and resume.awards }
\section{Achievements / Awards}
\begin{itemize}[leftmargin=1.6em]
\BLOCK{ for item in resume.awards }
\item \small \BLOCK{ if item.link }\href{\VAR{item.link}}{\VAR{item.description}}\BLOCK{ else }\VAR{item.description}\BLOCK{ endif }\BLOCK{ if item.date } (\VAR{item.date | format_month_year})\BLOCK{ endif }
\BLOCK{ endfor }
\end{itemize}
\BLOCK{ endif }

\BLOCK{ if section_key == "leadership" and resume.leadership }
\section{Leadership | Roles \& Responsibilities}
\begin{itemize}[leftmargin=1.6em]
\BLOCK{ for item in resume.leadership }
\item \small \BLOCK{ if item.link }\href{\VAR{item.link}}{\VAR{item.description}}\BLOCK{ else }\VAR{item.description}\BLOCK{ endif }\BLOCK{ if item.date } (\VAR{item.date | format_month_year})\BLOCK{ endif }
\BLOCK{ endfor }
\end{itemize}
\BLOCK{ endif }

\BLOCK{ if section_key == "extracurricular" and resume.extracurricular }
\section{Extracurricular Activities}
\begin{itemize}[leftmargin=1.6em]
\BLOCK{ for item in resume.extracurricular }
\item \small \BLOCK{ if item.link }\href{\VAR{item.link}}{\VAR{item.description}}\BLOCK{ else }\VAR{item.description}\BLOCK{ endif }\BLOCK{ if item.date } (\VAR{item.date | format_month_year})\BLOCK{ endif }
\BLOCK{ endfor }
\end{itemize}
\BLOCK{ endif }

\BLOCK{ endfor }

\end{document}
````

## File: backend/app/__init__.py
````python

````

## File: backend/app/ai_client.py
````python
from __future__ import annotations

import json
from datetime import datetime, timezone

from groq import Groq
from openai import OpenAI
from pydantic import ValidationError

from app.ai_prompts import build_parse_messages, build_repair_messages
from app.config import get_settings
from app.resume_normalizer import canonicalize_resume_sections
from app.schema import Resume


def extract_json_object(content: str) -> dict:
    text = content.strip()
    if text.startswith("```"):
        lines = [line for line in text.splitlines() if not line.strip().startswith("```")]
        text = "\n".join(lines).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1 or start >= end:
            raise
        return json.loads(text[start : end + 1])


def _call_chat_completion(messages: list[dict[str, str]]) -> str:
    settings = get_settings()

    if settings.ai_provider == "groq":
        if not settings.groq_api_key:
            raise RuntimeError("GROQ_API_KEY is not configured.")
        client = Groq(api_key=settings.groq_api_key)
        response = client.chat.completions.create(
            model=settings.groq_model,
            temperature=0,
            messages=messages,
        )
        content = response.choices[0].message.content
    elif settings.ai_provider == "openai":
        if not settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is not configured.")
        client = OpenAI(api_key=settings.openai_api_key)
        response = client.chat.completions.create(
            model=settings.openai_model,
            temperature=0,
            messages=messages,
        )
        content = response.choices[0].message.content
    else:
        raise RuntimeError(f"Unsupported AI provider: {settings.ai_provider}")

    if not content:
        raise RuntimeError("Model returned an empty response.")
    return content


def _clean_text(value: object) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _extract_date(value: dict) -> str | None:
    for key in ("date", "year", "start_date", "end_date"):
        date_value = _clean_text(value.get(key))
        if date_value:
            return date_value
    return None


def _extract_link(value: dict, link_keys: tuple[str, ...]) -> str | None:
    for key in link_keys:
        link_value = _clean_text(value.get(key))
        if link_value:
            return link_value
    return None


def _dict_to_compact_item(
    value: dict, description_keys: tuple[str, ...], link_keys: tuple[str, ...]
) -> dict[str, str | None] | None:
    description = None
    for key in description_keys:
        description = _clean_text(value.get(key))
        if description:
            break
    if not description:
        bullets = value.get("bullets")
        if isinstance(bullets, list):
            description = _clean_text(", ".join(str(item) for item in bullets if str(item).strip()))
    if not description:
        return None
    return {
        "description": description,
        "date": _extract_date(value),
        "link": _extract_link(value, link_keys),
    }


def _coerce_compact_items(
    raw_value: object,
    description_keys: tuple[str, ...],
    link_keys: tuple[str, ...] = ("link", "url"),
) -> list[dict[str, str | None]]:
    normalized: list[dict[str, str | None]] = []
    if raw_value is None:
        return normalized

    if isinstance(raw_value, str):
        description = _clean_text(raw_value)
        if description:
            normalized.append({"description": description, "date": None, "link": None})
        return normalized

    if isinstance(raw_value, dict):
        item = _dict_to_compact_item(raw_value, description_keys, link_keys)
        if item:
            normalized.append(item)
        return normalized

    if isinstance(raw_value, list):
        for entry in raw_value:
            if isinstance(entry, str):
                description = _clean_text(entry)
                if description:
                    normalized.append({"description": description, "date": None, "link": None})
                continue
            if isinstance(entry, dict):
                item = _dict_to_compact_item(entry, description_keys, link_keys)
                if item:
                    normalized.append(item)
    return normalized


def _section_kind(title: str) -> str:
    lowered = title.lower()
    if "cert" in lowered or "license" in lowered:
        return "certifications"
    if "award" in lowered or "achievement" in lowered or "honor" in lowered:
        return "awards"
    if "leadership" in lowered or "role" in lowered or "responsibility" in lowered:
        return "leadership"
    if (
        "volunteer" in lowered
        or "extracurricular" in lowered
        or "extra curricular" in lowered
        or "hackathon" in lowered
        or "competition" in lowered
        or "participation" in lowered
        or "activity" in lowered
        or "open source" in lowered
    ):
        return "extracurricular"
    return "drop"


def _coerce_legacy_sections(payload: dict) -> dict:
    certifications = _coerce_compact_items(
        payload.get("certifications"),
        ("description", "name", "title"),
        ("link", "url", "credential_url"),
    )
    awards = _coerce_compact_items(
        payload.get("awards"),
        ("description", "title", "name"),
        ("link", "url"),
    )
    leadership = _coerce_compact_items(
        payload.get("leadership"),
        ("description", "title", "name"),
        ("link", "url"),
    )
    extracurricular = _coerce_compact_items(
        payload.get("extracurricular"),
        ("description", "role", "title", "name"),
        ("link", "url"),
    )

    # Legacy "volunteering" maps to extracurricular.
    extracurricular.extend(
        _coerce_compact_items(
            payload.get("volunteering"),
            ("description", "role", "organization"),
            ("link", "url"),
        )
    )

    # Legacy "custom_sections" can contain leadership/extracurricular/awards/certs.
    custom_sections = payload.get("custom_sections")
    if isinstance(custom_sections, dict):
        custom_sections = [{"title": key, "items": value} for key, value in custom_sections.items()]

    if isinstance(custom_sections, list):
        for section in custom_sections:
            if isinstance(section, str):
                description = _clean_text(section)
                if description:
                    extracurricular.append({"description": description, "date": None, "link": None})
                continue
            if not isinstance(section, dict):
                continue
            title = _clean_text(section.get("title")) or ""
            items = section.get("items")
            parsed_items = _coerce_compact_items(
                items,
                ("description", "title", "name", "role"),
                ("link", "url"),
            )
            if not parsed_items:
                continue
            kind = _section_kind(title)
            if kind == "certifications":
                certifications.extend(parsed_items)
            elif kind == "awards":
                awards.extend(parsed_items)
            elif kind == "leadership":
                leadership.extend(parsed_items)
            elif kind == "extracurricular":
                extracurricular.extend(parsed_items)

    payload["certifications"] = certifications
    payload["awards"] = awards
    payload["leadership"] = leadership
    payload["extracurricular"] = extracurricular

    payload.pop("publications", None)
    payload.pop("custom_sections", None)
    payload.pop("volunteering", None)
    return payload


def _validate_resume(payload: dict) -> Resume:
    payload = _coerce_legacy_sections(payload)
    resume = Resume.model_validate(payload)
    resume = canonicalize_resume_sections(resume)
    now = datetime.now(timezone.utc).isoformat()
    if not resume.meta.created_at:
        resume.meta.created_at = now
    resume.meta.updated_at = now
    resume.meta.source = "ai"
    return resume


def parse_resume_text(raw_text: str) -> Resume:
    first_response = _call_chat_completion(build_parse_messages(raw_text))

    try:
        return _validate_resume(extract_json_object(first_response))
    except (json.JSONDecodeError, ValidationError) as error:
        repair_response = _call_chat_completion(
            build_repair_messages(first_response, str(error))
        )
        repaired_payload = extract_json_object(repair_response)
        return _validate_resume(repaired_payload)
````

## File: backend/app/ai_prompts.py
````python
from __future__ import annotations

import json
from textwrap import dedent


SCHEMA_OVERVIEW = dedent(
    """
    {
      "meta": {
        "version": "1.0",
        "created_at": "ISO_DATE",
        "updated_at": "ISO_DATE",
        "source": "upload | form | ai",
        "template": "template_id",
        "page_limit": 1
      },
      "header": {
        "name": null,
        "title": null,
        "email": null,
        "phone": null,
        "location": null,
        "linkedin": null,
        "github": null,
        "website": null,
        "portfolio": null
      },
      "summary": null,
      "skills": [],
      "experience": [],
      "education": [],
      "projects": [],
      "certifications": [],
      "awards": [],
      "leadership": [],
      "extracurricular": []
    }
    """
).strip()


EXAMPLE_ONE_INPUT = dedent(
    """
    Jane Doe
    Product Designer
    jane@example.com | +1 555-0100 | Austin, TX
    linkedin.com/in/janedoe | github.com/janedoe

    Summary
    Product designer with 5 years of experience designing SaaS workflows.

    Skills
    Figma, UX Research, Design Systems

    Experience
    Senior Product Designer, Acme Corp, Austin, TX, 2022-01 to Present
    - Led redesign of onboarding flow, improving activation by 18%.
    - Built component library adopted by 3 product squads.

    Education
    B.Des, Industrial Design, RISD, Providence, 2014, 2018

    Certifications
    - Google UX Certificate (2022)
    """
).strip()


EXAMPLE_ONE_OUTPUT = {
    "meta": {
        "version": "1.0",
        "created_at": "2024-01-01T00:00:00+00:00",
        "updated_at": "2024-01-01T00:00:00+00:00",
        "source": "ai",
        "template": "modern",
        "page_limit": 1,
    },
    "header": {
        "name": "Jane Doe",
        "title": "Product Designer",
        "email": "jane@example.com",
        "phone": "+1 555-0100",
        "location": "Austin, TX",
        "linkedin": "linkedin.com/in/janedoe",
        "github": "github.com/janedoe",
        "website": None,
        "portfolio": None,
    },
    "summary": "Product designer with 5 years of experience designing SaaS workflows.",
    "skills": ["Figma", "UX Research", "Design Systems"],
    "experience": [
        {
            "id": None,
            "role": "Senior Product Designer",
            "company": "Acme Corp",
            "location": "Austin, TX",
            "start_date": "2022-01",
            "end_date": None,
            "current": True,
            "description": None,
            "bullets": [
                "Led redesign of onboarding flow, improving activation by 18%.",
                "Built component library adopted by 3 product squads.",
            ],
        }
    ],
    "education": [
        {
            "degree": "B.Des",
            "field": "Industrial Design",
            "institution": "RISD",
            "location": "Providence",
            "start_year": "2014",
            "end_year": "2018",
            "gpa": None,
        }
    ],
    "projects": [],
    "certifications": [
        {
            "description": "Google UX Certificate",
            "date": "2022",
            "link": "https://example.com/certificate"
        }
    ],
    "awards": [],
    "leadership": [],
    "extracurricular": [],
}


EXAMPLE_TWO_INPUT = dedent(
    """
    Michael Chen
    Software Engineer
    michael@example.com | Seattle, WA | michaelchen.dev

    SUMMARY
    Backend engineer focused on APIs, cloud platforms, and observability.

    TECHNICAL SKILLS
    Languages: Python, Go
    Tools: Docker, Kubernetes, PostgreSQL

    PROJECTS
    Resume Formatter
    - Built a FastAPI service for parsing resume documents.
    - Used Docker to compile LaTeX into PDFs.
    Technologies: Python, FastAPI, Docker

    Leadership & Responsibilities
    - Led a 10-member engineering club (2023)

    Hackathons / Competitions
    - Top 8 finalist, City AI Hackathon (2024)
    """
).strip()


EXAMPLE_TWO_OUTPUT = {
    "meta": {
        "version": "1.0",
        "created_at": "2024-01-01T00:00:00+00:00",
        "updated_at": "2024-01-01T00:00:00+00:00",
        "source": "ai",
        "template": "modern",
        "page_limit": 1,
    },
    "header": {
        "name": "Michael Chen",
        "title": "Software Engineer",
        "email": "michael@example.com",
        "phone": None,
        "location": "Seattle, WA",
        "linkedin": None,
        "github": None,
        "website": "michaelchen.dev",
        "portfolio": None,
    },
    "summary": "Backend engineer focused on APIs, cloud platforms, and observability.",
    "skills": [
        {"category": "Languages", "items": ["Python", "Go"]},
        {"category": "Tools", "items": ["Docker", "Kubernetes", "PostgreSQL"]},
    ],
    "experience": [],
    "education": [],
    "projects": [
        {
            "title": "Resume Formatter",
            "description": None,
            "start_date": "06, 2025",
            "end_date": "09, 2025",
            "technologies": ["Python", "FastAPI", "Docker"],
            "bullets": [
                "Built a FastAPI service for parsing resume documents.",
                "Used Docker to compile LaTeX into PDFs.",
            ],
            "link": "https://github.com/michael/resume-formatter",
        }
    ],
    "certifications": [],
    "awards": [],
    "leadership": [
        {
            "description": "Led a 10-member engineering club",
            "date": "2023",
            "link": None
        }
    ],
    "extracurricular": [
        {
            "description": "Top 8 finalist, City AI Hackathon",
            "date": "2024",
            "link": None
        }
    ],
}


SYSTEM_PROMPT = dedent(
    """
    You are a structured resume parser.
    Return only valid JSON.
    Do not wrap the JSON in markdown.
    Do not include explanations or extra keys.
    If data is missing, use null for single values or [] for arrays.
    Use ISO-like dates where possible.
    Resume section order in source text can vary; detect by meaning, not position.

    Allowed sections only (max 10 total):
    1) header
    2) summary
    3) skills
    4) education
    5) experience
    6) projects
    7) certifications
    8) awards
    9) leadership
    10) extracurricular

    Section mapping:
    - "Profile", "Objective", "About" -> summary
    - "Internships", "Work History", "Experience" -> experience
    - "Technical Skills", "Core Competencies" -> skills
    - "Achievements", "Honors" -> awards
    - "Leadership", "Roles & Responsibilities" -> leadership
    - "Extracurricular", "Volunteer Work", "Activities", "Participations", "Hackathons", "Competitions", "Open Source Contributions" -> extracurricular

    For certifications, awards, leadership, extracurricular:
    - Use line items only in shape: {"description": "...", "date": "...", "link": "..."}.
    - Keep concise one-line descriptions.
    - Date is optional; set null if unknown.
    - Link is optional; set null if unknown.

    For projects:
    - Include optional start_date and end_date when available.
    - If description is present, prefer bullets as [].

    Do not output sections outside the allowed list.
    Ignore/remove publications and custom sections.

    The JSON must match this schema shape exactly:
    """
).strip()


def build_parse_messages(raw_text: str) -> list[dict[str, str]]:
    example_block = dedent(
        f"""
        Example 1 input:
        {EXAMPLE_ONE_INPUT}

        Example 1 output:
        {json.dumps(EXAMPLE_ONE_OUTPUT, indent=2)}

        Example 2 input:
        {EXAMPLE_TWO_INPUT}

        Example 2 output:
        {json.dumps(EXAMPLE_TWO_OUTPUT, indent=2)}
        """
    ).strip()

    user_prompt = dedent(
        f"""
        Parse the following resume text into JSON.
        Return JSON only.

        Schema:
        {SCHEMA_OVERVIEW}

        {example_block}

        Resume text:
        {raw_text}
        """
    ).strip()

    return [
        {"role": "system", "content": f"{SYSTEM_PROMPT}\n{SCHEMA_OVERVIEW}"},
        {"role": "user", "content": user_prompt},
    ]


def build_repair_messages(bad_output: str, error_message: str) -> list[dict[str, str]]:
    user_prompt = dedent(
        f"""
        The previous resume JSON was invalid.
        Fix it so it matches this schema exactly and return JSON only.

        Schema:
        {SCHEMA_OVERVIEW}

        Validation error:
        {error_message}

        Previous output:
        {bad_output}
        """
    ).strip()

    return [
        {"role": "system", "content": f"{SYSTEM_PROMPT}\n{SCHEMA_OVERVIEW}"},
        {"role": "user", "content": user_prompt},
    ]
````

## File: backend/app/compiler.py
````python
from __future__ import annotations

import logging
import subprocess
import tempfile
from pathlib import Path

from app.config import get_settings
from app.latex_utils import build_latex_environment, sanitize_for_latex
from app.schema import RenderOptions, Resume


logger = logging.getLogger(__name__)


def _tail(text: str, length: int = 2000) -> str:
    stripped = (text or "").strip()
    return stripped[-length:] if stripped else ""


def _resolve_template_name(options: RenderOptions, environment) -> str:
    requested = options.template.strip()
    if not requested:
        requested = "modern"

    candidates = [
        f"{requested}.tex.jinja",
        f"{requested}_resume.tex.jinja",
    ]
    available = set(environment.list_templates())
    for candidate in candidates:
        if candidate in available:
            return candidate

    raise RuntimeError(
        f"Unknown template '{options.template}'. Available templates: "
        f"{', '.join(sorted(name for name in available if name.endswith('.tex.jinja')))}"
    )


def render_latex_template(resume: Resume, options: RenderOptions) -> str:
    environment = build_latex_environment()
    template_name = _resolve_template_name(options, environment)
    template = environment.get_template(template_name)
    safe_resume = sanitize_for_latex(resume.model_dump(mode="json"))
    safe_options = sanitize_for_latex(options.model_dump(mode="json"))
    return template.render(resume=safe_resume, options=safe_options)


def compile_latex_document(tex_source: str, *, image: str | None = None) -> bytes:
    settings = get_settings()
    compiler_image = image or settings.compiler_image

    with tempfile.TemporaryDirectory(prefix="resume-compile-") as temp_dir:
        temp_path = Path(temp_dir)
        tex_path = temp_path / "resume.tex"
        pdf_path = temp_path / "resume.pdf"

        tex_path.write_text(tex_source, encoding="utf-8")

        command = [
            "docker",
            "run",
            "--rm",
            "--memory=512m",
            "--cpus=0.5",
            "--pids-limit=64",
            "-v",
            f"{temp_path.resolve()}:/work",
            compiler_image,
            "/work/resume.tex",
        ]

        result = subprocess.run(command, capture_output=True, text=True, check=False)
        logger.info("LaTeX stdout: %s", result.stdout)
        logger.info("LaTeX stderr: %s", result.stderr)

        if result.returncode != 0:
            stdout_tail = _tail(result.stdout)
            stderr_tail = _tail(result.stderr)
            raise RuntimeError(
                "LaTeX compilation failed. "
                f"docker exit code={result.returncode}. "
                f"stderr_tail={stderr_tail!r}. "
                f"stdout_tail={stdout_tail!r}"
            )

        if not pdf_path.exists():
            raise RuntimeError("LaTeX compilation finished without producing resume.pdf")

        return pdf_path.read_bytes()
````

## File: backend/app/config.py
````python
from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv


ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIR / ".env.local", override=False)
load_dotenv(ROOT_DIR / ".env", override=False)


@dataclass(frozen=True)
class Settings:
    ai_provider: str = os.getenv("AI_PROVIDER", "groq").strip().lower()
    groq_api_key: str | None = os.getenv("GROQ_API_KEY")
    groq_model: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    openai_api_key: str | None = os.getenv("OPENAI_API_KEY")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
    compiler_image: str = os.getenv("COMPILER_IMAGE", "resume-compiler:local")
    allowed_upload_types: tuple[str, ...] = tuple(
        part.strip().lower()
        for part in os.getenv("ALLOWED_UPLOAD_TYPES", ".pdf,.docx").split(",")
        if part.strip()
    )
    max_upload_size_mb: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "5"))
    frontend_origin: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
    next_public_api_base: str = os.getenv("NEXT_PUBLIC_API_BASE", "http://localhost:8000")


@lru_cache
def get_settings() -> Settings:
    return Settings()
````

## File: backend/app/latex_utils.py
````python
from __future__ import annotations

import unicodedata
from pathlib import Path
import re
from typing import Any

from jinja2 import Environment, FileSystemLoader


LATEX_SPECIALS = {
    "&": r"\&",
    "%": r"\%",
    "$": r"\$",
    "#": r"\#",
    "_": r"\_",
    "{": r"\{",
    "}": r"\}",
    "~": r"\textasciitilde{}",
    "^": r"\^{}",
    "\\": r"\textbackslash{}",
}

UNICODE_TEXT_REPLACEMENTS = {
    "\u00a0": " ",  # non-breaking space
    "\u200b": "",  # zero-width space
    "\u2012": "-",  # figure dash
    "\u2013": "--",  # en dash
    "\u2014": "---",  # em dash
    "\u2018": "'",  # left single quote
    "\u2019": "'",  # right single quote
    "\u201c": '"',  # left double quote
    "\u201d": '"',  # right double quote
    "\u2022": r"\textbullet{}",  # bullet
    "\u2026": "...",  # ellipsis
    "\u2212": "-",  # minus
}

MONTH_ABBREVIATIONS = {
    1: "Jan",
    2: "Feb",
    3: "Mar",
    4: "Apr",
    5: "May",
    6: "Jun",
    7: "Jul",
    8: "Aug",
    9: "Sep",
    10: "Oct",
    11: "Nov",
    12: "Dec",
}

MONTH_NAME_TO_NUMBER = {
    "jan": 1,
    "january": 1,
    "feb": 2,
    "february": 2,
    "mar": 3,
    "march": 3,
    "apr": 4,
    "april": 4,
    "may": 5,
    "jun": 6,
    "june": 6,
    "jul": 7,
    "july": 7,
    "aug": 8,
    "august": 8,
    "sep": 9,
    "sept": 9,
    "september": 9,
    "oct": 10,
    "october": 10,
    "nov": 11,
    "november": 11,
    "dec": 12,
    "december": 12,
}


def _normalize_unicode(value: str) -> str:
    normalized = value
    for source, target in UNICODE_TEXT_REPLACEMENTS.items():
        normalized = normalized.replace(source, target)

    # Convert superscripts/accents to plain ASCII-friendly text for pdflatex.
    normalized = unicodedata.normalize("NFKD", normalized)
    normalized = "".join(
        char for char in normalized if not unicodedata.combining(char)
    )
    normalized = normalized.encode("ascii", "ignore").decode("ascii")

    # Drop non-printable control characters except whitespace that LaTeX can handle.
    return "".join(
        char for char in normalized if char == "\n" or char == "\t" or ord(char) >= 32
    )


def escape_latex(value: str | None) -> str:
    if not value:
        return ""
    normalized = _normalize_unicode(value)
    return "".join(LATEX_SPECIALS.get(char, char) for char in normalized)


def _parse_month_year(value: str) -> tuple[int, str] | None:
    cleaned = value.strip()
    if not cleaned:
        return None

    number_formats = [
        re.match(r"^(\d{1,2})\s*[,/\-]\s*(\d{4})$", cleaned),
        re.match(r"^(\d{4})\s*[,/\-]\s*(\d{1,2})$", cleaned),
        re.match(r"^(\d{4})-(\d{2})-\d{2}$", cleaned),
    ]
    for match in number_formats:
        if match:
            first = int(match.group(1))
            second = int(match.group(2))
            if first > 12:
                month, year = second, str(first)
            else:
                month, year = first, str(second)
            if 1 <= month <= 12:
                return month, year

    name_match = re.match(r"^([A-Za-z]+)\s*[,/\-\s]?\s*(\d{4})$", cleaned)
    if name_match:
        month_name = name_match.group(1).lower()
        year = name_match.group(2)
        month = MONTH_NAME_TO_NUMBER.get(month_name)
        if month:
            return month, year

    return None


def format_month_year(value: str | None) -> str:
    if not value:
        return ""
    parsed = _parse_month_year(value)
    if not parsed:
        return value
    month, year = parsed
    return f"{MONTH_ABBREVIATIONS[month]} {year}"


def format_date_range(start: str | None, end: str | None, current: bool = False) -> str:
    start_formatted = format_month_year(start)
    if current:
        if start_formatted:
            return f"{start_formatted} -- Present"
        return "Present"
    end_formatted = format_month_year(end)
    if start_formatted and end_formatted:
        return f"{start_formatted} -- {end_formatted}"
    if start_formatted:
        return start_formatted
    if end_formatted:
        return end_formatted
    return ""


def sanitize_for_latex(value: Any) -> Any:
    if isinstance(value, str):
        return escape_latex(value)
    if isinstance(value, list):
        return [sanitize_for_latex(item) for item in value]
    if isinstance(value, dict):
        return {key: sanitize_for_latex(item) for key, item in value.items()}
    return value


def build_latex_environment() -> Environment:
    templates_dir = Path(__file__).resolve().parent / "templates"
    environment = Environment(
        loader=FileSystemLoader(str(templates_dir)),
        autoescape=False,
        block_start_string=r"\BLOCK{",
        block_end_string="}",
        variable_start_string=r"\VAR{",
        variable_end_string="}",
        comment_start_string=r"\#{",
        comment_end_string="}",
        trim_blocks=True,
        lstrip_blocks=True,
    )
    environment.filters["format_month_year"] = format_month_year
    environment.filters["format_date_range"] = format_date_range
    return environment
````

## File: backend/app/main.py
````python
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import health, match, parse, render, upload
from app.config import get_settings


settings = get_settings()
app = FastAPI(title="Resume LaTeX MVP")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.frontend_origin == "*" else [settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/upload", tags=["upload"])
app.include_router(parse.router, prefix="/parse", tags=["parse"])
app.include_router(render.router, prefix="/render", tags=["render"])
app.include_router(match.router, prefix="/match", tags=["match"])
app.include_router(health.router, prefix="/health", tags=["health"])
````

## File: backend/app/matcher.py
````python
from __future__ import annotations

import re

from app.schema import Resume, SectionKey


STOP_WORDS = {
    "about",
    "after",
    "also",
    "among",
    "and",
    "are",
    "back",
    "been",
    "being",
    "build",
    "built",
    "can",
    "for",
    "from",
    "have",
    "into",
    "job",
    "more",
    "must",
    "our",
    "role",
    "team",
    "that",
    "the",
    "their",
    "them",
    "they",
    "this",
    "using",
    "with",
    "you",
    "your",
}


def _tokenize(text: str) -> list[str]:
    normalized = re.sub(r"[^a-z0-9+#.\s]", " ", text.lower())
    return [
        token
        for token in normalized.split()
        if len(token) >= 3 and token not in STOP_WORDS
    ]


def _skills_to_text(skills: list[str] | list[dict]) -> str:
    if not skills:
        return ""

    first_item = skills[0]
    if isinstance(first_item, str):
        return " ".join(item for item in skills if isinstance(item, str))

    parts: list[str] = []
    for item in skills:
        if not isinstance(item, dict):
            continue
        category = str(item.get("category") or "").strip()
        if category:
            parts.append(category)
        for skill in item.get("items") or []:
            if isinstance(skill, str) and skill.strip():
                parts.append(skill.strip())
    return " ".join(parts)


def _resume_to_text(resume: Resume) -> str:
    experience_text = " ".join(
        filter(
            None,
            [
                *(item.role or "" for item in resume.experience),
                *(item.company or "" for item in resume.experience),
                *(item.location or "" for item in resume.experience),
                *(item.description or "" for item in resume.experience),
                *(
                    bullet
                    for item in resume.experience
                    for bullet in item.bullets
                    if bullet.strip()
                ),
            ],
        )
    )

    education_text = " ".join(
        filter(
            None,
            [
                *(item.degree or "" for item in resume.education),
                *(item.field or "" for item in resume.education),
                *(item.institution or "" for item in resume.education),
                *(item.location or "" for item in resume.education),
            ],
        )
    )

    project_text = " ".join(
        filter(
            None,
            [
                *(item.title or "" for item in resume.projects),
                *(item.description or "" for item in resume.projects),
                *(item.link or "" for item in resume.projects),
                *(
                    tech
                    for item in resume.projects
                    for tech in item.technologies
                    if tech.strip()
                ),
                *(
                    bullet
                    for item in resume.projects
                    for bullet in item.bullets
                    if bullet.strip()
                ),
            ],
        )
    )

    compact_text = " ".join(
        filter(
            None,
            [
                *(
                    item.description or ""
                    for section in (
                        resume.certifications,
                        resume.awards,
                        resume.leadership,
                        resume.extracurricular,
                    )
                    for item in section
                ),
                *(
                    item.date or ""
                    for section in (
                        resume.certifications,
                        resume.awards,
                        resume.leadership,
                        resume.extracurricular,
                    )
                    for item in section
                ),
                *(
                    item.link or ""
                    for section in (
                        resume.certifications,
                        resume.awards,
                        resume.leadership,
                        resume.extracurricular,
                    )
                    for item in section
                ),
            ],
        )
    )

    parts = [
        resume.header.name or "",
        resume.header.title or "",
        resume.summary or "",
        _skills_to_text(resume.model_dump(mode="json")["skills"]),
        experience_text,
        education_text,
        project_text,
        compact_text,
    ]

    return " ".join(part for part in parts if part)


def _build_suggestions(
    resume: Resume,
    missing_keywords: list[str],
    score: int,
) -> list[dict[str, str | SectionKey]]:
    suggestions: list[dict[str, str | SectionKey]] = []
    keyword_sample = missing_keywords[:4]

    if (not resume.summary or len(resume.summary.strip()) < 80) and keyword_sample:
        suggestions.append(
            {
                "section": "summary",
                "title": "Tailor the top summary",
                "detail": f"Mention high-value terms like {', '.join(keyword_sample)} near the top of the resume.",
            }
        )

    if keyword_sample:
        suggestions.append(
            {
                "section": "skills",
                "title": "Expand the skills section",
                "detail": f"Add only the missing keywords you truly have, especially {', '.join(keyword_sample[:3])}.",
            }
        )

    if resume.experience:
        suggestions.append(
            {
                "section": "experience",
                "title": "Retune experience bullets",
                "detail": "Mirror the job description language in impact bullets and measurable achievements.",
            }
        )

    if resume.projects and score < 80:
        suggestions.append(
            {
                "section": "projects",
                "title": "Use projects to close keyword gaps",
                "detail": "Surface relevant tools, domains, and outcomes in project descriptions where appropriate.",
            }
        )

    if not suggestions:
        suggestions.append(
            {
                "section": "summary",
                "title": "Keep tailoring before download",
                "detail": "Your resume already overlaps well. Tighten the summary and section ordering for the target role.",
            }
        )

    return suggestions[:4]


def match_resume_to_job(resume: Resume, job_description: str) -> dict:
    jd_tokens = _tokenize(job_description)
    resume_tokens = _tokenize(_resume_to_text(resume))
    resume_keyword_set = set(resume_tokens)
    frequency: dict[str, int] = {}

    for token in jd_tokens:
        frequency[token] = frequency.get(token, 0) + 1

    analyzed_keywords = [
        keyword
        for keyword, _ in sorted(
            frequency.items(),
            key=lambda item: (-item[1], item[0]),
        )[:16]
    ]

    matched_keywords = [
        keyword for keyword in analyzed_keywords if keyword in resume_keyword_set
    ]
    missing_keywords = [
        keyword for keyword in analyzed_keywords if keyword not in resume_keyword_set
    ]

    if not analyzed_keywords:
        score = 0
    else:
        score = round((len(matched_keywords) / len(analyzed_keywords)) * 100)
        score = max(8, min(98, score))

    return {
        "score": score,
        "analyzed_keywords": analyzed_keywords,
        "matched_keywords": matched_keywords,
        "missing_keywords": missing_keywords,
        "suggestions": _build_suggestions(resume, missing_keywords, score),
    }
````

## File: backend/app/requirements.txt
````
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
python-multipart>=0.0.9
pdfplumber>=0.11.0
python-docx>=1.1.2
jinja2>=3.1.4
pydantic>=2.8.2
httpx>=0.27.0
groq>=0.9.0
openai>=1.37.0
python-dotenv>=1.0.1
pytest>=8.2.0
pytest-asyncio>=0.23.7
````

## File: backend/app/resume_normalizer.py
````python
from __future__ import annotations

from urllib.parse import urlparse

from app.schema import CompactItem, Resume, SkillCategory

MAX_TOTAL_SECTION_COUNT = 10  # header + up to 9 additional sections
MAX_EXPERIENCE_ITEMS = 4
MAX_PROJECT_ITEMS = 4
MAX_EDUCATION_ITEMS = 2
MAX_BULLETS_PER_ITEM = 3
MAX_CERTIFICATION_ITEMS = 3
MAX_AWARD_ITEMS = 3
MAX_LEADERSHIP_ITEMS = 3
MAX_EXTRACURRICULAR_ITEMS = 3


def _clean_text(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def _clean_string_list(values: list[str]) -> list[str]:
    cleaned: list[str] = []
    for value in values:
        item = _clean_text(value)
        if item:
            cleaned.append(item)
    return cleaned


def _normalize_link(value: str | None) -> str | None:
    cleaned = _clean_text(value)
    if not cleaned:
        return None
    if cleaned.startswith("mailto:"):
        return cleaned
    parsed = urlparse(cleaned)
    if parsed.scheme:
        return cleaned
    if "@" in cleaned and "/" not in cleaned and " " not in cleaned:
        return f"mailto:{cleaned}"
    return f"https://{cleaned}"


def _clean_compact_items(items: list[CompactItem], limit: int) -> list[CompactItem]:
    normalized: list[CompactItem] = []
    for item in items:
        description = _clean_text(item.description)
        date = _clean_text(item.date)
        link = _normalize_link(item.link)
        if description:
            normalized.append(CompactItem(description=description, date=date, link=link))
    return normalized[:limit]


def canonicalize_resume_sections(resume: Resume) -> Resume:
    resume.header.name = _clean_text(resume.header.name)
    resume.header.title = _clean_text(resume.header.title)
    resume.header.email = _clean_text(resume.header.email)
    resume.header.phone = _clean_text(resume.header.phone)
    resume.header.location = _clean_text(resume.header.location)
    resume.header.linkedin = _normalize_link(resume.header.linkedin)
    resume.header.github = _normalize_link(resume.header.github)
    resume.header.website = _normalize_link(resume.header.website)
    resume.header.portfolio = _normalize_link(resume.header.portfolio)
    resume.summary = _clean_text(resume.summary)

    if resume.skills:
        if isinstance(resume.skills[0], str):
            resume.skills = _clean_string_list(resume.skills)
        else:
            normalized_categories: list[SkillCategory] = []
            for category in resume.skills:
                category_name = _clean_text(category.category)
                category_items = _clean_string_list(category.items)
                if category_name and category_items:
                    normalized_categories.append(
                        SkillCategory(category=category_name, items=category_items)
                    )
            resume.skills = normalized_categories

    for experience in resume.experience:
        experience.role = _clean_text(experience.role)
        experience.company = _clean_text(experience.company)
        experience.location = _clean_text(experience.location)
        experience.start_date = _clean_text(experience.start_date)
        experience.end_date = _clean_text(experience.end_date)
        experience.description = _clean_text(experience.description)
        experience.bullets = _clean_string_list(experience.bullets)[:MAX_BULLETS_PER_ITEM]
        if experience.description:
            experience.bullets = []
        elif experience.bullets:
            experience.description = None
    resume.experience = resume.experience[:MAX_EXPERIENCE_ITEMS]

    for education in resume.education:
        education.degree = _clean_text(education.degree)
        education.field = _clean_text(education.field)
        education.institution = _clean_text(education.institution)
        education.location = _clean_text(education.location)
        education.start_year = _clean_text(education.start_year)
        education.end_year = _clean_text(education.end_year)
        education.gpa = _clean_text(education.gpa)
    resume.education = resume.education[:MAX_EDUCATION_ITEMS]

    for project in resume.projects:
        project.title = _clean_text(project.title)
        project.description = _clean_text(project.description)
        project.start_date = _clean_text(project.start_date)
        project.end_date = _clean_text(project.end_date)
        project.link = _normalize_link(project.link)
        project.technologies = _clean_string_list(project.technologies)
        project.bullets = _clean_string_list(project.bullets)[:MAX_BULLETS_PER_ITEM]
        if project.description:
            project.bullets = []
        elif project.bullets:
            project.description = None
    resume.projects = resume.projects[:MAX_PROJECT_ITEMS]

    resume.certifications = _clean_compact_items(
        resume.certifications, MAX_CERTIFICATION_ITEMS
    )
    resume.awards = _clean_compact_items(resume.awards, MAX_AWARD_ITEMS)
    resume.leadership = _clean_compact_items(resume.leadership, MAX_LEADERSHIP_ITEMS)
    resume.extracurricular = _clean_compact_items(
        resume.extracurricular, MAX_EXTRACURRICULAR_ITEMS
    )

    # Schema is capped to 10 blocks by construction:
    # header + summary + skills + education + experience + projects
    # + certifications + awards + leadership + extracurricular.
    _ = MAX_TOTAL_SECTION_COUNT
    return resume
````

## File: backend/app/schema.py
````python
from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated, Literal

from pydantic import BaseModel, Field, field_validator


class ResumeMeta(BaseModel):
    version: str = "1.0"
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    updated_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    source: str = "ai"
    template: str = "modern"
    page_limit: int = 1


class ResumeHeader(BaseModel):
    name: str | None = None
    title: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    linkedin: str | None = None
    github: str | None = None
    website: str | None = None
    portfolio: str | None = None


class SkillCategory(BaseModel):
    category: str
    items: list[str] = Field(default_factory=list)


class ExperienceItem(BaseModel):
    id: str | None = None
    role: str | None = None
    company: str | None = None
    location: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    current: bool = False
    description: str | None = None
    bullets: list[str] = Field(default_factory=list)


class EducationItem(BaseModel):
    degree: str | None = None
    field: str | None = None
    institution: str | None = None
    location: str | None = None
    start_year: str | None = None
    end_year: str | None = None
    gpa: str | None = None


class ProjectItem(BaseModel):
    title: str | None = None
    description: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    technologies: list[str] = Field(default_factory=list)
    bullets: list[str] = Field(default_factory=list)
    link: str | None = None


class CompactItem(BaseModel):
    description: str | None = None
    date: str | None = None
    link: str | None = None


SectionKey = Literal[
    "summary",
    "skills",
    "education",
    "experience",
    "projects",
    "certifications",
    "awards",
    "leadership",
    "extracurricular",
]


def default_section_order() -> list[SectionKey]:
    return [
        "summary",
        "skills",
        "education",
        "experience",
        "projects",
        "certifications",
        "awards",
        "leadership",
        "extracurricular",
    ]


MarginString = Annotated[str, Field(pattern=r"^[0-9]+(?:\.[0-9]+)?(?:cm|in|mm|pt)$")]


class RenderOptions(BaseModel):
    template: str = "modern"
    font_size: int = Field(default=11, ge=9, le=14)
    max_bullets_per_job: int = Field(default=4, ge=1, le=8)
    margin: MarginString = "1cm"
    page_limit: int = Field(default=1, ge=1, le=2)
    section_order: list[SectionKey] = Field(default_factory=default_section_order)


class Resume(BaseModel):
    meta: ResumeMeta = Field(default_factory=ResumeMeta)
    header: ResumeHeader = Field(default_factory=ResumeHeader)
    summary: str | None = None
    skills: list[str] | list[SkillCategory] = Field(default_factory=list)
    experience: list[ExperienceItem] = Field(default_factory=list)
    education: list[EducationItem] = Field(default_factory=list)
    projects: list[ProjectItem] = Field(default_factory=list)
    certifications: list[CompactItem] = Field(default_factory=list)
    awards: list[CompactItem] = Field(default_factory=list)
    leadership: list[CompactItem] = Field(default_factory=list)
    extracurricular: list[CompactItem] = Field(default_factory=list)

    @field_validator("summary", mode="before")
    @classmethod
    def normalize_summary(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


class ParseRequest(BaseModel):
    text: str | None = None
    file_id: str | None = None


class RenderRequest(BaseModel):
    resume: Resume
    template: str = "modern"
    options: RenderOptions = Field(default_factory=RenderOptions)


class MatchRequest(BaseModel):
    resume: Resume
    job_description: str


class MatchSuggestion(BaseModel):
    section: SectionKey
    title: str
    detail: str


class MatchResponse(BaseModel):
    score: int = Field(ge=0, le=100)
    analyzed_keywords: list[str] = Field(default_factory=list)
    matched_keywords: list[str] = Field(default_factory=list)
    missing_keywords: list[str] = Field(default_factory=list)
    suggestions: list[MatchSuggestion] = Field(default_factory=list)
````

## File: backend/app/store.py
````python
from __future__ import annotations

from threading import Lock
from uuid import uuid4


_TEXT_STORE: dict[str, str] = {}
_STORE_LOCK = Lock()


def save_text(text: str) -> str:
    file_id = uuid4().hex
    with _STORE_LOCK:
        _TEXT_STORE[file_id] = text
    return file_id


def get_text(file_id: str) -> str | None:
    with _STORE_LOCK:
        return _TEXT_STORE.get(file_id)
````

## File: backend/tests/test_match.py
````python
from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app
from app.matcher import match_resume_to_job


SAMPLE_RESUME = {
    "meta": {
        "version": "1.0",
        "created_at": "2024-01-01T00:00:00+00:00",
        "updated_at": "2024-01-01T00:00:00+00:00",
        "source": "ai",
        "template": "modern",
        "page_limit": 1,
    },
    "header": {
        "name": "Taylor Brooks",
        "title": "Platform Engineer",
        "email": "taylor@example.com",
        "phone": "555-0101",
        "location": "Chicago, IL",
        "linkedin": None,
        "github": "github.com/taylor",
        "website": None,
        "portfolio": None,
    },
    "summary": "Builds reliable backend platforms with Python, FastAPI, Docker, and AWS.",
    "skills": ["Python", "FastAPI", "Docker", "AWS"],
    "experience": [
        {
            "role": "Platform Engineer",
            "company": "Northwind",
            "location": "Chicago, IL",
            "start_date": "2022-01",
            "end_date": None,
            "current": True,
            "description": None,
            "bullets": [
                "Built backend services in Python and FastAPI.",
                "Deployed Docker workloads on AWS.",
            ],
        }
    ],
    "education": [],
    "projects": [],
    "certifications": [],
    "awards": [],
    "leadership": [],
    "extracurricular": [],
}


def test_match_resume_to_job_returns_keywords_and_suggestions() -> None:
    from app.schema import Resume

    result = match_resume_to_job(
        Resume.model_validate(SAMPLE_RESUME),
        "Looking for a backend engineer with Python FastAPI AWS Kubernetes and CI/CD experience.",
    )

    assert result["score"] >= 8
    assert "python" in result["matched_keywords"]
    assert "kubernetes" in result["missing_keywords"]
    assert result["suggestions"]


def test_match_endpoint_returns_analysis() -> None:
    client = TestClient(app)

    response = client.post(
        "/match",
        json={
            "resume": SAMPLE_RESUME,
            "job_description": "Backend engineer with Python FastAPI AWS Kubernetes and CI/CD experience.",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["score"] >= 8
    assert "python" in payload["matched_keywords"]
    assert isinstance(payload["suggestions"], list)


def test_match_endpoint_rejects_blank_job_description() -> None:
    client = TestClient(app)

    response = client.post(
        "/match",
        json={
            "resume": SAMPLE_RESUME,
            "job_description": "   ",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Provide a job description."
````

## File: backend/tests/test_parse.py
````python
from __future__ import annotations

from app import ai_client


VALID_JSON = """
{
  "header": {
    "name": "Jordan Miles",
    "title": "Software Engineer",
    "email": "jordan@example.com",
    "phone": null,
    "location": "New York, NY",
    "linkedin": null,
    "github": "github.com/jordan",
    "website": null
  },
  "summary": "Backend engineer.",
  "skills": ["Python", "FastAPI"],
  "experience": [],
  "education": [],
  "projects": [],
  "certifications": [],
  "awards": [],
  "leadership": [],
  "extracurricular": []
}
"""


NORMALIZATION_JSON = """
{
  "header": {
    "name": "  Jordan Miles  ",
    "title": "Software Engineer",
    "email": "jordan@example.com"
  },
  "summary": "  Builds APIs.  ",
  "skills": ["Python", "", "FastAPI"],
  "experience": [],
  "education": [],
  "projects": [],
  "certifications": [],
  "awards": [],
  "volunteering": [
    {"role": "Smart India Hackathon Winner"}
  ],
  "custom_sections": [
    {
      "title": "Leadership - Roles & Responsibilities",
      "items": ["Led 20-member dev club"]
    }
  ]
}
"""


def test_parse_resume_text_returns_validated_resume(monkeypatch) -> None:
    monkeypatch.setattr(ai_client, "_call_chat_completion", lambda messages: VALID_JSON)

    resume = ai_client.parse_resume_text("Jordan Miles")

    assert resume.header.name == "Jordan Miles"
    assert resume.skills == ["Python", "FastAPI"]
    assert resume.meta.source == "ai"


def test_parse_resume_text_repairs_invalid_json(monkeypatch) -> None:
    responses = iter(
        [
            '{"header":{"name":"Broken"},"skills":',
            VALID_JSON,
        ]
    )

    monkeypatch.setattr(
        ai_client,
        "_call_chat_completion",
        lambda messages: next(responses),
    )

    resume = ai_client.parse_resume_text("Jordan Miles")

    assert resume.header.name == "Jordan Miles"


def test_parse_resume_text_fills_missing_defaults(monkeypatch) -> None:
    minimal_json = """
    {
      "header": {
        "name": "Alex Rivera"
      }
    }
    """
    monkeypatch.setattr(ai_client, "_call_chat_completion", lambda messages: minimal_json)

    resume = ai_client.parse_resume_text("Alex Rivera")

    assert resume.header.name == "Alex Rivera"
    assert resume.experience == []
    assert resume.projects == []
    assert resume.certifications == []


def test_parse_resume_text_normalizes_legacy_sections(monkeypatch) -> None:
    monkeypatch.setattr(ai_client, "_call_chat_completion", lambda messages: NORMALIZATION_JSON)

    resume = ai_client.parse_resume_text("Jordan Miles")

    assert resume.header.name == "Jordan Miles"
    assert resume.summary == "Builds APIs."
    assert resume.skills == ["Python", "FastAPI"]
    assert len(resume.extracurricular) == 1
    assert resume.extracurricular[0].description == "Smart India Hackathon Winner"
    assert len(resume.leadership) == 1
    assert resume.leadership[0].description == "Led 20-member dev club"


def test_parse_resume_text_limits_optional_sections_to_one_page(monkeypatch) -> None:
    compact_json = """
    {
      "header": {"name": "A"},
      "summary": "S",
      "skills": ["Python"],
      "experience": [],
      "education": [],
      "projects": [],
      "certifications": [
        {"description": "Cert 1"},
        {"description": "Cert 2"},
        {"description": "Cert 3"},
        {"description": "Cert 4"}
      ],
      "awards": [
        {"description": "Award 1"},
        {"description": "Award 2"},
        {"description": "Award 3"},
        {"description": "Award 4"}
      ],
      "leadership": [
        {"description": "Lead Team A"},
        {"description": "Lead Team B"},
        {"description": "Lead Team C"},
        {"description": "Lead Team D"}
      ],
      "extracurricular": [
        {"description": "Volunteer 1"},
        {"description": "Volunteer 2"},
        {"description": "Volunteer 3"},
        {"description": "Volunteer 4"}
      ]
    }
    """
    monkeypatch.setattr(ai_client, "_call_chat_completion", lambda messages: compact_json)

    resume = ai_client.parse_resume_text("A")

    assert len(resume.certifications) <= 3
    assert len(resume.awards) <= 3
    assert len(resume.leadership) <= 3
    assert len(resume.extracurricular) <= 3

    section_count = 1  # header
    if resume.summary:
        section_count += 1
    if resume.skills:
        section_count += 1
    if resume.experience:
        section_count += 1
    if resume.education:
        section_count += 1
    if resume.projects:
        section_count += 1
    if resume.certifications:
        section_count += 1
    if resume.awards:
        section_count += 1
    if resume.leadership:
        section_count += 1
    if resume.extracurricular:
        section_count += 1

    assert section_count <= 10
````

## File: backend/tests/test_render.py
````python
from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app


SAMPLE_RESUME = {
    "meta": {
        "version": "1.0",
        "created_at": "2024-01-01T00:00:00+00:00",
        "updated_at": "2024-01-01T00:00:00+00:00",
        "source": "ai",
        "template": "modern",
        "page_limit": 1,
    },
    "header": {
        "name": "Taylor Brooks",
        "title": "Platform Engineer",
        "email": "taylor@example.com",
        "phone": "555-0101",
        "location": "Chicago, IL",
        "linkedin": None,
        "github": "github.com/taylor",
        "website": None,
    },
    "summary": "Builds reliable backend platforms.",
    "skills": ["Python", "Docker"],
    "experience": [],
    "education": [],
    "projects": [],
    "certifications": [],
    "awards": [],
    "leadership": [],
    "extracurricular": [],
}


def test_render_endpoint_returns_pdf(monkeypatch) -> None:
    client = TestClient(app)

    monkeypatch.setattr(
        "app.api.render.compile_latex_document",
        lambda tex_source: b"%PDF-1.4 fake pdf bytes",
    )

    response = client.post(
        "/render",
        json={
            "resume": SAMPLE_RESUME,
            "template": "modern",
            "options": {
                "template": "modern",
                "font_size": 11,
                "margin": "1cm",
                "max_bullets_per_job": 4,
                "page_limit": 1,
            },
        },
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 10
````

## File: backend/Dockerfile
````
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends docker.io \
    && rm -rf /var/lib/apt/lists/*

COPY app/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY . /app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
````

## File: compiler/Dockerfile
````
FROM debian:stable-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        texlive-latex-base \
        texlive-latex-extra \
        texlive-fonts-recommended \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --shell /bin/bash compiler

WORKDIR /work

COPY run_compile.sh /app/run_compile.sh
RUN chmod +x /app/run_compile.sh

USER compiler

ENTRYPOINT ["/app/run_compile.sh"]
````

## File: compiler/run_compile.sh
````bash
#!/usr/bin/env bash
set -euo pipefail

workfile="${1:-}"

if [[ -z "${workfile}" ]]; then
  echo "usage: run_compile.sh /work/resume.tex" >&2
  exit 1
fi

cd "$(dirname "${workfile}")"

pdflatex -interaction=nonstopmode -halt-on-error -file-line-error -no-shell-escape "$(basename "${workfile}")"
pdflatex -interaction=nonstopmode -halt-on-error -file-line-error -no-shell-escape "$(basename "${workfile}")"
````

## File: ResumeKitty/app/about/page.tsx
````typescript
'use client';

import { BookOpen, Cat, Code, Sparkles, Target } from 'lucide-react';
import { motion } from 'motion/react';

const sections = [
  {
    title: 'Our Mission',
    content: 'We believe that everyone deserves a high-quality resume without the complexity of manual typesetting. ResumeKitty was built to provide magical tools for modern job seekers.',
    icon: Target,
    color: 'text-brand-orange',
  },
  {
    title: 'The Technology',
    content: 'Leveraging advanced AI models, ResumeKitty accurately identifies sections, dates, and achievements in your resume, translating them into perfectly structured LaTeX code.',
    icon: Code,
    color: 'text-brand-green-dark',
  },
  {
    title: 'Why LaTeX?',
    content: 'LaTeX is the industry standard for professional documents. It ensures your resume maintains consistent typography, perfect spacing, and a clean layout across all platforms.',
    icon: BookOpen,
    color: 'text-brand-pink',
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-16 pb-20">
      <div className="space-y-4 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-block rounded-full border-4 border-brand-brown bg-white p-6 shadow-[4px_4px_0px_0px_rgba(74,62,62,1)]"
        >
          <Cat size={48} className="text-brand-orange" />
        </motion.div>
        <h1 className="text-6xl text-brand-brown">About ResumeKitty</h1>
        <p className="mx-auto max-w-2xl text-xl font-medium text-gray-600">
          Empowering job seekers with magical, precision-engineered resume tools.
        </p>
      </div>

      <div className="grid gap-8">
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="cute-card flex flex-col items-center gap-8 p-8 transition-colors hover:bg-brand-cream/50 md:flex-row md:items-start"
            >
              <div
                className={`rounded-2xl border-4 border-brand-brown bg-white p-4 shadow-[4px_4px_0px_0px_rgba(74,62,62,1)] ${section.color}`}
              >
                <Icon size={32} />
              </div>
              <div className="space-y-3 text-center md:text-left">
                <h3 className="text-3xl text-brand-brown">{section.title}</h3>
                <p className="text-lg leading-relaxed text-gray-600">{section.content}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="space-y-6 border-t-4 border-brand-brown/10 pt-10 text-center">
        <p className="text-2xl italic text-brand-brown">&quot;Magic in every line, purr-fection in every detail.&quot;</p>
        <div className="flex justify-center gap-4">
          <Sparkles className="text-brand-accent" />
          <Cat className="text-brand-pink" />
          <Sparkles className="text-brand-accent" />
        </div>
      </motion.div>
    </div>
  );
}
````

## File: ResumeKitty/app/builder/page.tsx
````typescript
import Link from 'next/link';
import { Cat, FolderHeart, Sparkles } from 'lucide-react';

import ResumeParser from '@/components/ResumeParser';
import { BUILDER_MODE_OPTIONS, BuilderMode } from '@/types/builder';

const VALID_MODES = new Set<BuilderMode>(['scratch', 'upload', 'match']);

type BuilderPageProps = {
  searchParams?: Promise<{ mode?: string }>;
};

export default async function BuilderPage({ searchParams }: BuilderPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const modeParam = resolvedSearchParams?.mode;
  const initialMode = VALID_MODES.has(modeParam as BuilderMode) ? (modeParam as BuilderMode) : 'upload';
  const activeModeLabel =
    BUILDER_MODE_OPTIONS.find((option) => option.id === initialMode)?.label ?? 'Upload and parse';

  return (
    <div className="mx-auto max-w-7xl space-y-10 pb-20">
      <section className="cute-card relative overflow-hidden bg-white p-8 md:p-10">
        <div className="absolute -right-10 -top-10 rounded-full bg-brand-pink/30 p-14 blur-2xl" />
        <div className="absolute -left-6 bottom-0 rounded-full bg-brand-green/30 p-12 blur-2xl" />
        <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-brand-brown bg-brand-cream px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-brown">
              <Sparkles size={14} className="text-brand-orange" />
              Unified Builder
            </div>
            <div className="space-y-3">
              <h1 className="text-5xl tracking-tight text-brand-brown md:text-6xl">
                One workspace for parse, edit, match, and preview.
              </h1>
              <p className="max-w-3xl text-base leading-7 text-gray-600 md:text-lg">
                You entered in <span className="font-semibold text-brand-brown">{activeModeLabel}</span> mode. The
                editor stays the same, so you can switch templates, compare a job description, and download only when
                you are ready to create an account.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/help" className="cute-button-secondary inline-flex items-center justify-center gap-2 px-5 py-3">
              <FolderHeart size={18} />
              Help center
            </Link>
            <Link href="/resumes" className="cute-button inline-flex items-center justify-center gap-2 px-5 py-3">
              <Cat size={18} />
              Open dashboard
            </Link>
          </div>
        </div>
      </section>

      <ResumeParser initialMode={initialMode} />
    </div>
  );
}
````

## File: ResumeKitty/app/features/page.tsx
````typescript
'use client';

import { Cat, Cpu, FileCode, Globe, Palette, Shield, Sparkles, Zap } from 'lucide-react';
import { motion } from 'motion/react';

const features = [
  {
    title: 'AI-Powered Extraction',
    description: 'Our advanced algorithms accurately identify your experience, skills, and education from any document format.',
    icon: Cpu,
    color: 'text-brand-orange',
  },
  {
    title: 'Instant LaTeX Export',
    description: 'Generate clean, compile-ready LaTeX code in seconds. Eliminate formatting struggles and margin issues.',
    icon: Zap,
    color: 'text-brand-green-dark',
  },
  {
    title: 'Magical Templates',
    description: 'Utilize industry-standard templates designed to pass through Applicant Tracking Systems with ease.',
    icon: Palette,
    color: 'text-brand-pink',
  },
  {
    title: 'Privacy & Security',
    description: 'Your data is processed with end-to-end encryption and is never stored longer than necessary for processing.',
    icon: Shield,
    color: 'text-brand-accent',
  },
  {
    title: 'Multi-Format Support',
    description: 'Seamlessly process PDFs, Word documents, and text files. Our engine handles the structural conversion.',
    icon: Globe,
    color: 'text-brand-orange',
  },
  {
    title: 'Real-time Preview',
    description: 'Monitor the parsing process in real-time and preview the structured output before exporting.',
    icon: FileCode,
    color: 'text-brand-green-dark',
  },
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-16 pb-20">
      <div className="space-y-4 text-center">
        <h1 className="text-7xl tracking-tight text-brand-brown">Magical Features</h1>
        <p className="mx-auto max-w-2xl text-xl font-medium text-gray-600">
          A comprehensive suite of tools designed for high-performance resume management and generation.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="cute-card space-y-4 p-8 transition-all hover:bg-brand-cream/50"
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-brand-brown bg-white shadow-[4px_4px_0px_0px_rgba(74,62,62,1)] ${feature.color}`}
              >
                <Icon size={28} />
              </div>
              <h3 className="text-2xl text-brand-brown">{feature.title}</h3>
              <p className="text-sm font-medium leading-relaxed text-gray-600">{feature.description}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="cute-card relative overflow-hidden bg-brand-orange p-12 text-center text-brand-brown">
        <div className="pointer-events-none absolute inset-0 opacity-10">
          <div className="flex h-full items-center justify-around">
            <Cat size={120} />
            <Sparkles size={100} />
            <Cat size={120} />
          </div>
        </div>
        <h2 className="relative z-10 text-5xl tracking-tight">Ready to elevate your resume?</h2>
        <p className="relative z-10 mx-auto max-w-xl text-xl font-medium text-brand-brown/80">
          Join thousands of job seekers who have optimized their career documents with ResumeKitty.
        </p>
        <button className="cute-button relative z-10 bg-white">Get Started Now</button>
      </div>
    </div>
  );
}
````

## File: ResumeKitty/app/help/page.tsx
````typescript
'use client';

import { Cat, FileQuestion, MessageCircle, Search } from 'lucide-react';
import { motion } from 'motion/react';

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="cute-card space-y-2 bg-white p-6"
    >
      <h4 className="text-xl text-brand-brown">{question}</h4>
      <p className="font-medium leading-relaxed text-gray-600">{answer}</p>
    </motion.div>
  );
}

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-12 pb-20">
      <div className="space-y-4 text-center">
        <div className="mb-2 flex justify-center">
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <Cat size={64} className="text-brand-orange" />
          </motion.div>
        </div>
        <h1 className="text-6xl tracking-tight text-brand-brown">How can we help?</h1>
        <div className="relative mx-auto max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-brown/40" />
          <input type="text" placeholder="Search for magical answers..." className="cute-input w-full pl-12" />
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="cute-card group cursor-pointer space-y-4 p-8 transition-colors hover:bg-brand-green/10">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-brand-brown bg-white text-brand-green-dark shadow-[4px_4px_0px_0px_rgba(74,62,62,1)] transition-transform group-hover:scale-110">
            <MessageCircle size={32} />
          </div>
          <h3 className="text-3xl text-brand-brown">Contact Support</h3>
          <p className="font-medium text-gray-600">Our kittens are ready to help you with any issues.</p>
        </div>
        <div className="cute-card group cursor-pointer space-y-4 p-8 transition-colors hover:bg-brand-orange/10">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-brand-brown bg-white text-brand-orange shadow-[4px_4px_0px_0px_rgba(74,62,62,1)] transition-transform group-hover:scale-110">
            <FileQuestion size={32} />
          </div>
          <h3 className="text-3xl text-brand-brown">FAQs</h3>
          <p className="font-medium text-gray-600">Find quick answers to common questions about your magical resume.</p>
        </div>
      </div>

      <div className="space-y-12">
        <section className="space-y-6">
          <h2 className="text-center text-4xl text-brand-brown">Resume Writing Guide</h2>
          <div className="grid gap-6">
            <FAQItem
              question="What makes a resume good?"
              answer="A good resume is clear, concise, and tailored to the job you're applying for. It should highlight your most relevant skills and achievements using action verbs and quantifiable results."
            />
            <FAQItem
              question="How long should my resume be?"
              answer="For most professionals, a one-page resume is ideal. If you have more than 10 years of relevant experience, a two-page resume is acceptable. Keep it focused on the most recent and relevant information."
            />
            <FAQItem
              question="Should I include a summary or an objective?"
              answer="A professional summary is generally preferred over an objective. A summary highlights your key qualifications and what you bring to the table, while an objective focuses on what you want from the employer."
            />
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-center text-4xl text-brand-brown">Types of Resumes</h2>
          <div className="grid gap-6">
            <FAQItem
              question="Chronological Resume"
              answer="The most common format. It lists your work history in reverse chronological order and works best for people with a steady career path in one field."
            />
            <FAQItem
              question="Functional Resume"
              answer="This format focuses on skills and experience rather than chronological work history. It works well for career changers or people with employment gaps."
            />
            <FAQItem
              question="Combination Resume"
              answer="A hybrid format that highlights skills at the top followed by chronological work history, which is useful when you want to show both expertise and a strong progression."
            />
          </div>
        </section>
      </div>
    </div>
  );
}
````

## File: ResumeKitty/app/parser/page.tsx
````typescript
import { redirect } from 'next/navigation';

export default function ParserPage() {
  redirect('/builder');
}
````

## File: ResumeKitty/app/profile/page.tsx
````typescript
'use client';

import { Cat, Mail, Shield, Sparkles, User } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Cat className="text-brand-orange" size={40} />
        <h1 className="text-5xl tracking-tight text-brand-brown">My Profile</h1>
      </div>

      <div className="cute-card space-y-8 bg-white p-8">
        <div className="flex flex-col items-center gap-8 border-b-4 border-brand-brown/10 pb-8 md:flex-row">
          <div className="flex h-32 w-32 items-center justify-center rounded-3xl border-4 border-brand-brown bg-brand-cream text-brand-orange shadow-[4px_4px_0px_0px_rgba(74,62,62,1)]">
            <User size={64} />
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-4xl text-brand-brown">Alex Rivera</h2>
            <p className="text-lg font-medium text-gray-500">alex.rivera@email.com</p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border-2 border-brand-pink/30 bg-brand-pink/20 px-4 py-1 text-sm font-bold text-brand-pink">
              <Sparkles size={14} />
              Magical Member
            </div>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-3">
            <label className="ml-1 text-sm font-bold uppercase tracking-widest text-brand-brown/50">Email Address</label>
            <div className="cute-input flex items-center gap-3 bg-brand-cream/30">
              <Mail size={20} className="text-brand-brown/40" />
              <span className="font-medium text-brand-brown">alex.rivera@email.com</span>
            </div>
          </div>
          <div className="space-y-3">
            <label className="ml-1 text-sm font-bold uppercase tracking-widest text-brand-brown/50">Account Type</label>
            <div className="cute-input flex items-center gap-3 border-brand-green/30 bg-brand-green/10">
              <Shield size={20} className="text-brand-green-dark" />
              <span className="font-bold text-brand-green-dark">Professional Plan</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button className="cute-button">Update Profile</button>
        </div>
      </div>
    </div>
  );
}
````

## File: ResumeKitty/app/resumes/page.tsx
````typescript
'use client';

import Link from 'next/link';
import { Download, ExternalLink, FileText, Sparkles, Trash2, Cat } from 'lucide-react';
import { motion } from 'motion/react';

const resumes = [
  { id: 1, name: 'Senior Software Engineer Resume', date: '2026-03-08', status: 'Ready to download' },
  { id: 2, name: 'Product Manager Application', date: '2026-03-04', status: 'Needs tailoring' },
];

export default function ResumesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-20">
      <section className="cute-card bg-white p-8 md:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Cat className="text-brand-orange" size={40} />
              <h1 className="text-5xl tracking-tight text-brand-brown">Dashboard</h1>
            </div>
            <p className="max-w-3xl text-base leading-7 text-gray-600">
              This is the post-download home for returning users. Re-open a resume in the builder, adjust the template,
              or tailor it for another job.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/builder?mode=scratch" className="cute-button inline-flex items-center justify-center gap-2 px-5 py-3">
              <Sparkles size={18} />
              New resume
            </Link>
            <Link href="/builder?mode=match" className="cute-button-secondary inline-flex items-center justify-center gap-2 px-5 py-3">
              <ExternalLink size={18} />
              Match a role
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="cute-card bg-brand-green/20 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-brown/60">Saved resumes</p>
          <p className="mt-3 text-4xl text-brand-brown">2</p>
        </div>
        <div className="cute-card bg-brand-orange/20 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-brown/60">Last export</p>
          <p className="mt-3 text-2xl text-brand-brown">March 8, 2026</p>
        </div>
        <div className="cute-card bg-brand-pink/20 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-brown/60">Next action</p>
          <p className="mt-3 text-2xl text-brand-brown">Tailor for a new role</p>
        </div>
      </div>

      <div className="grid gap-6">
        {resumes.map((resume, index) => (
          <motion.div
            key={resume.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
            className="cute-card flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="flex items-center gap-6">
              <div className="rounded-2xl border-4 border-brand-brown bg-white p-4 text-brand-orange shadow-[4px_4px_0px_0px_rgba(74,62,62,1)]">
                <FileText size={28} />
              </div>
              <div>
                <h3 className="text-2xl text-brand-brown">{resume.name}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Last modified: {resume.date}</p>
                  <span className="rounded-full border-2 border-brand-orange/30 bg-brand-orange/20 px-2 py-0.5 text-[10px] font-black uppercase text-brand-orange">
                    {resume.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/builder?mode=upload"
                className="rounded-xl border-2 border-brand-brown/10 bg-brand-cream p-3 text-brand-brown/60 transition-all hover:border-brand-brown/30 hover:text-brand-orange"
                title="Open in builder"
              >
                <ExternalLink size={20} />
              </Link>
              <button
                type="button"
                className="rounded-xl border-2 border-brand-brown/10 bg-brand-cream p-3 text-brand-brown/60 transition-all hover:border-brand-brown/30 hover:text-brand-brown"
                title="Download"
              >
                <Download size={20} />
              </button>
              <button
                type="button"
                className="rounded-xl border-2 border-brand-brown/10 bg-brand-cream p-3 text-brand-brown/60 transition-all hover:border-brand-brown/30 hover:text-red-500"
                title="Delete"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
````

## File: ResumeKitty/app/settings/page.tsx
````typescript
'use client';

import { Bell, Cat, Lock } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Cat className="text-brand-orange" size={40} />
        <h1 className="text-5xl tracking-tight text-brand-brown">Settings</h1>
      </div>

      <div className="space-y-8">
        <section className="cute-card space-y-6 p-8">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-2xl border-2 border-brand-orange/20 bg-brand-orange/10 p-3 text-brand-orange">
              <Bell size={28} />
            </div>
            <h2 className="text-3xl text-brand-brown">Notifications</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border-4 border-brand-brown/10 bg-brand-cream/30 p-6">
              <div>
                <p className="text-lg font-bold text-brand-brown">Email Notifications</p>
                <p className="text-sm font-medium text-gray-500">Receive updates about your resume parsing status.</p>
              </div>
              <div className="relative h-8 w-14 cursor-pointer rounded-full border-2 border-brand-brown/20 bg-brand-orange shadow-inner">
                <div className="absolute right-1 top-1 h-5 w-5 rounded-full bg-white shadow-[2px_2px_0px_0px_rgba(74,62,62,0.2)]" />
              </div>
            </div>
          </div>
        </section>

        <section className="cute-card space-y-6 p-8">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-2xl border-2 border-brand-brown/20 bg-brand-brown/10 p-3 text-brand-brown">
              <Lock size={28} />
            </div>
            <h2 className="text-3xl text-brand-brown">Security</h2>
          </div>
          <div className="flex justify-start">
            <button className="cute-button border-brand-brown/20 bg-brand-cream text-brand-brown">Change Password</button>
          </div>
        </section>
      </div>
    </div>
  );
}
````

## File: ResumeKitty/app/globals.css
````css
@import "tailwindcss";

@theme {
  --color-brand-brown: #4a3e3e;
  --color-brand-orange: #f2a172;
  --color-brand-pink: #f2c2cf;
  --color-brand-green: #a8d5ba;
  --color-brand-green-light: #d4edda;
  --color-brand-green-dark: #7fb693;
  --color-brand-cream: #fff9f0;
  --color-brand-accent: #ffd93d;

  --font-sans: var(--font-sans);
  --font-display: var(--font-display);
}

@layer base {
  body {
    @apply bg-brand-cream text-brand-brown font-sans;
    background-image: radial-gradient(#f2c2cf 1px, transparent 1px);
    background-size: 40px 40px;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    @apply font-display;
  }
}

@layer components {
  .cute-card {
    @apply rounded-3xl border-4 border-brand-brown bg-white p-6 shadow-[8px_8px_0px_0px_rgba(74, 62, 62, 1)] transition-all;
  }

  .cute-button {
    @apply rounded-2xl border-4 border-brand-brown bg-brand-orange px-6 py-3 font-display text-lg text-brand-brown shadow-[4px_4px_0px_0px_rgba(74, 62, 62, 1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(74, 62, 62, 1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50;
  }

  .cute-button-secondary {
    @apply rounded-2xl border-4 border-brand-brown bg-white px-6 py-3 font-display text-lg text-brand-brown shadow-[4px_4px_0px_0px_rgba(74, 62, 62, 1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(74, 62, 62, 1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50;
  }

  .cute-input {
    @apply rounded-2xl border-4 border-brand-brown bg-white px-4 py-3 font-sans transition-all focus:border-brand-orange focus:outline-none focus:ring-4 focus:ring-brand-orange/20;
  }

  .pro-card {
    @apply rounded-3xl border-4 border-brand-brown bg-white p-6 shadow-[8px_8px_0px_0px_rgba(74, 62, 62, 1)] transition-all;
  }

  .pro-button {
    @apply rounded-2xl border-4 border-brand-brown bg-brand-orange px-6 py-3 font-display text-lg text-brand-brown shadow-[4px_4px_0px_0px_rgba(74, 62, 62, 1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(74, 62, 62, 1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50;
  }

  .pro-button-secondary {
    @apply rounded-2xl border-4 border-brand-brown bg-white px-6 py-3 font-display text-lg text-brand-brown shadow-[4px_4px_0px_0px_rgba(74, 62, 62, 1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(74, 62, 62, 1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50;
  }

  .pro-input {
    @apply rounded-2xl border-4 border-brand-brown bg-white px-4 py-3 font-sans transition-all focus:border-brand-orange focus:outline-none focus:ring-4 focus:ring-brand-orange/20;
  }

  .markdown-body {
    @apply font-sans leading-relaxed;
  }

  .markdown-body h1,
  .markdown-body h2,
  .markdown-body h3 {
    @apply mt-6 mb-4 font-display text-brand-brown;
  }

  .markdown-body p {
    @apply mb-4;
  }

  .markdown-body ul {
    @apply mb-4 list-inside list-disc space-y-2;
  }
}
````

## File: ResumeKitty/app/layout.tsx
````typescript
import type { Metadata } from 'next';
import { Fredoka, Inter } from 'next/font/google';

import Navbar from '@/components/Navbar';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fredoka = Fredoka({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'ResumeKitty | AI Resume Builder',
  description: 'A kawaii AI resume builder for parsing, editing, matching, previewing, and gated PDF download.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fredoka.variable}`} suppressHydrationWarning>
      <body className="bg-brand-cream text-brand-brown font-sans antialiased">
        <Navbar />
        <main className="min-h-screen pt-20">
          <div className="mx-auto max-w-7xl p-4 md:p-8">{children}</div>
        </main>
      </body>
    </html>
  );
}
````

## File: ResumeKitty/app/page.tsx
````typescript
'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight, Cat, Heart, Sparkles, Star, Target } from 'lucide-react';
import { motion } from 'motion/react';

const StorySection = dynamic(() => import('@/components/StorySection'), { ssr: false });

const entryModes = [
  {
    href: '/builder?mode=scratch',
    title: 'Create from scratch',
    description: 'Jump straight into the editor with a blank structured resume.',
    accent: 'bg-brand-orange/20',
  },
  {
    href: '/builder?mode=upload',
    title: 'Upload and parse',
    description: 'Import an existing PDF or DOCX, inspect the extracted text, and clean it up.',
    accent: 'bg-brand-green/20',
  },
  {
    href: '/builder?mode=match',
    title: 'Match a job description',
    description: 'Tailor one resume against a specific role without leaving the builder.',
    accent: 'bg-brand-pink/20',
  },
];

export default function Home() {
  return (
    <div className="relative overflow-hidden pb-16">
      <div className="absolute left-10 top-20 animate-bounce delay-100 opacity-20">
        <Star className="h-12 w-12 text-brand-orange" />
      </div>
      <div className="absolute right-20 top-40 animate-pulse opacity-20">
        <Heart className="h-16 w-16 text-brand-pink" />
      </div>
      <div className="absolute bottom-20 left-1/4 animate-bounce delay-500 opacity-10">
        <Sparkles className="h-10 w-10 text-yellow-400" />
      </div>

      <div className="container mx-auto space-y-16 px-4 pt-10">
        <section className="space-y-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="inline-block"
          >
            <div className="rounded-full border-4 border-brand-brown bg-white p-6 shadow-[6px_6px_0px_0px_rgba(74,62,62,1)]">
              <Cat size={64} className="text-brand-orange" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-5"
          >
            <h1 className="text-6xl font-display text-brand-brown md:text-8xl">
              Resume<span className="text-brand-orange">Kitty</span>
            </h1>
            <p className="mx-auto max-w-3xl text-xl font-medium leading-8 text-gray-600 md:text-2xl">
              A kawaii AI resume builder with one clean workspace for upload, editing, template switching, JD matching,
              preview, and gated download.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/builder?mode=scratch" className="cute-button inline-flex items-center gap-2">
                Start building
                <ArrowRight size={16} />
              </Link>
              <Link href="/builder?mode=upload" className="cute-button border-brand-pink/50 bg-brand-pink text-white">
                Upload a resume
              </Link>
            </div>
          </motion.div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {entryModes.map((mode, index) => (
            <motion.div
              key={mode.title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className={`cute-card ${mode.accent} p-6`}
            >
              <div className="rounded-2xl border-4 border-brand-brown bg-white p-3 text-brand-orange shadow-[4px_4px_0px_0px_rgba(74,62,62,1)] w-fit">
                <Target size={24} />
              </div>
              <h2 className="mt-5 text-2xl text-brand-brown">{mode.title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">{mode.description}</p>
              <Link href={mode.href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-brown">
                Open workspace
                <ArrowRight size={14} />
              </Link>
            </motion.div>
          ))}
        </section>

        <StorySection />
      </div>

      <div className="pointer-events-none fixed bottom-0 left-0 z-0 w-full opacity-40">
        <div className="flex items-end justify-around">
          <Cat className="h-24 w-24 text-brand-pink" />
          <Cat className="h-32 w-32 text-brand-orange" />
          <Cat className="h-20 w-20 text-brand-pink" />
          <Cat className="h-28 w-28 text-brand-orange" />
          <Cat className="h-24 w-24 text-brand-pink" />
        </div>
      </div>
    </div>
  );
}
````

## File: ResumeKitty/components/DownloadGateModal.tsx
````typescript
'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Lock, Mail, UserRound, X } from 'lucide-react';

type DownloadGateModalProps = {
  open: boolean;
  onClose: () => void;
  onUnlock: (payload: { fullName: string; email: string }) => void;
};

const EMAIL_PATTERN = /\S+@\S+\.\S+/;

export default function DownloadGateModal({ open, onClose, onUnlock }: DownloadGateModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  function handleUnlock() {
    if (!fullName.trim()) {
      setError('Add your name to continue.');
      return;
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Enter a valid email address to unlock download.');
      return;
    }

    onUnlock({
      fullName: fullName.trim(),
      email: email.trim(),
    });
  }

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setError('');
              onClose();
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            className="cute-card relative z-10 w-full max-w-xl bg-white p-8"
          >
            <button
              type="button"
              onClick={() => {
                setError('');
                onClose();
              }}
              className="absolute right-4 top-4 rounded-full border-2 border-brand-brown bg-white p-2 text-brand-brown transition hover:scale-105"
              aria-label="Close download gate"
            >
              <X size={18} />
            </button>

            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border-2 border-brand-brown bg-brand-cream px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-brown">
                <Lock size={14} className="text-brand-orange" />
                Download Gate
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl tracking-tight text-brand-brown">Create your kitty account to download.</h3>
                <p className="text-sm leading-6 text-gray-600">
                  ResumeKitty only asks for signup when you export so you can explore the builder first.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-brand-brown">Full name</span>
                <div className="relative">
                  <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-brown/40" size={18} />
                  <input
                    className="cute-input w-full pl-11"
                    value={fullName}
                    onChange={(event) => {
                      setFullName(event.target.value);
                      if (error) {
                        setError('');
                      }
                    }}
                    placeholder="Mittens Applicant"
                  />
                </div>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-brand-brown">Email</span>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-brown/40" size={18} />
                  <input
                    className="cute-input w-full pl-11"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (error) {
                        setError('');
                      }
                    }}
                    placeholder="mittens@example.com"
                  />
                </div>
              </label>

              {error ? (
                <p className="rounded-2xl border-4 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              ) : null}

              <button type="button" onClick={handleUnlock} className="cute-button w-full">
                Unlock PDF download
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
````

## File: ResumeKitty/components/JsonEditorForm.tsx
````typescript
'use client';

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  ExternalLink, 
  GripVertical, 
  X, 
  Settings, 
  Eye, 
  EyeOff,
  Sparkles,
  FileJson
} from 'lucide-react';

import {
  RenderOptions,
  Resume,
  ResumeSectionKey,
  SECTION_MANAGER_OPTIONS,
  TEMPLATE_OPTIONS,
  createEmptyResume
} from "@/types/resume";
import MasterDetailEditModal from "@/components/MasterDetailEditModal";

type JsonEditorFormProps = {
  resume: Resume | null;
  options: RenderOptions;
  template: string;
  onResumeChange: (resume: Resume) => void;
  onOptionsChange: (options: RenderOptions) => void;
  onTemplateChange: (template: string) => void;
  hiddenSections: ResumeSectionKey[];
  onToggleSection: (section: ResumeSectionKey) => void;
  onShowAllSections: () => void;
  sectionOrder: ResumeSectionKey[];
  onSectionOrderChange: (order: ResumeSectionKey[]) => void;
  onRender: () => void;
  rendering: boolean;
  renderError: string;
};

type CompactSectionKey = "certifications" | "awards" | "leadership" | "extracurricular";

const COMPACT_SECTION_CONFIG: Array<{ key: CompactSectionKey; label: string }> = [
  { key: "certifications", label: "Certifications" },
  { key: "awards", label: "Achievements / Awards" },
  { key: "leadership", label: "Leadership / Responsibilities" },
  { key: "extracurricular", label: "Extracurricular Activities" }
];

const LINK_HEADER_FIELDS: Array<keyof Resume["header"]> = ["linkedin", "github", "website", "portfolio"];

function updateHeader(resume: Resume, field: keyof Resume["header"], value: string): Resume {
  return {
    ...resume,
    header: {
      ...resume.header,
      [field]: value
    }
  };
}

function skillsToText(skills: Resume["skills"]): string {
  if (!skills || skills.length === 0) {
    return "";
  }
  if (typeof skills[0] === "string") {
    return (skills as string[]).join("\n");
  }
  return (skills as Array<{ category: string; items: string[] }>)
    .map((entry) => `${entry.category}: ${entry.items.join(", ")}`)
    .join("\n");
}

function textToSkills(value: string): Resume["skills"] {
  const lines = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.every((line) => !line.includes(":"))) {
    return lines;
  }

  return lines.map((line) => {
    const [category, items] = line.split(":");
    return {
      category: category.trim(),
      items: (items || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    };
  });
}

function toExternalUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.startsWith("mailto:") || trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.includes("@") && !trimmed.includes(" ")) {
    return `mailto:${trimmed}`;
  }
  return `https://${trimmed}`;
}

function reorderSections(
  sections: ResumeSectionKey[],
  source: ResumeSectionKey,
  target: ResumeSectionKey
): ResumeSectionKey[] {
  if (source === target) {
    return sections;
  }
  const sourceIndex = sections.indexOf(source);
  const targetIndex = sections.indexOf(target);
  if (sourceIndex === -1 || targetIndex === -1) {
    return sections;
  }
  const next = [...sections];
  next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, source);
  return next;
}

function toNonEmptyLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function JsonEditorForm({
  resume,
  options,
  template,
  onResumeChange,
  onOptionsChange,
  onTemplateChange,
  hiddenSections,
  onToggleSection,
  onShowAllSections,
  sectionOrder,
  onSectionOrderChange,
  onRender,
  rendering,
  renderError
}: JsonEditorFormProps) {
  const activeResume = resume || createEmptyResume();
  const [jsonDraft, setJsonDraft] = useState(JSON.stringify(activeResume, null, 2));
  const [jsonError, setJsonError] = useState("");
  const [masterEditorOpen, setMasterEditorOpen] = useState(false);
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [activeModalSection, setActiveModalSection] = useState<ResumeSectionKey>("summary");
  const [draggingSection, setDraggingSection] = useState<ResumeSectionKey | null>(null);

  const sectionLabelMap = useMemo(() => {
    const map = new Map<ResumeSectionKey, string>();
    SECTION_MANAGER_OPTIONS.forEach((section) => {
      map.set(section.id, section.label);
    });
    return map;
  }, []);

  useEffect(() => {
    setJsonDraft(JSON.stringify(activeResume, null, 2));
  }, [activeResume]);

  return (
    <div className="space-y-12">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-display text-brand-brown">Edit Resume Details</h2>
        <p className="text-gray-600">Update fields directly or open the master-detail editor for focused section editing.</p>
        <div className="pt-3">
          <button
            type="button"
            onClick={() => setMasterEditorOpen(true)}
            className="cute-button-secondary inline-flex items-center justify-center gap-2 px-6 py-3"
          >
            <Sparkles size={18} />
            Open Master Editor
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Header Section */}
        <div className="cute-card p-8 bg-white space-y-6">
          <h3 className="text-2xl font-display text-brand-orange flex items-center gap-2">
            <Sparkles size={24} /> Header
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {(
              [
                ["name", "Name"],
                ["title", "Title"],
                ["email", "Email"],
                ["phone", "Phone"],
                ["location", "Location"],
                ["linkedin", "LinkedIn"],
                ["github", "GitHub"],
                ["website", "Website"],
                ["portfolio", "Portfolio"]
              ] as Array<[keyof Resume["header"], string]>
            ).map(([field, label]) => {
              const currentValue = activeResume.header[field] ?? "";
              const showLink = LINK_HEADER_FIELDS.includes(field) && currentValue.trim().length > 0;
              return (
                <div key={field} className="flex flex-col gap-1">
                  <span className="text-sm font-display text-gray-500 ml-2">{label}</span>
                  <div className="relative">
                    <input
                      className="cute-input w-full pr-10"
                      value={currentValue}
                      onChange={(event) => onResumeChange(updateHeader(activeResume, field, event.target.value))}
                    />
                    {showLink && (
                      <a
                        href={toExternalUrl(currentValue)}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-orange hover:scale-110 transition-transform"
                      >
                        <ExternalLink size={18} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary & Skills Section */}
        <div className="space-y-8">
          <div className="cute-card p-8 bg-white space-y-6">
            <h3 className="text-2xl font-display text-brand-pink flex items-center gap-2">
              <Sparkles size={24} /> Summary
            </h3>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-display text-gray-500 ml-2">Professional Summary</span>
              <textarea
                className="cute-input w-full h-32 resize-none"
                value={activeResume.summary ?? ""}
                onChange={(event) =>
                  onResumeChange({
                    ...activeResume,
                    summary: event.target.value
                  })
                }
              />
            </div>
          </div>

          <div className="cute-card p-8 bg-white space-y-6">
            <h3 className="text-2xl font-display text-brand-accent flex items-center gap-2">
              <Sparkles size={24} /> Skills
            </h3>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-display text-gray-500 ml-2">Skills (Category: Item1, Item2...)</span>
              <textarea
                className="cute-input w-full h-32 resize-none"
                value={skillsToText(activeResume.skills)}
                onChange={(event) =>
                  onResumeChange({
                    ...activeResume,
                    skills: textToSkills(event.target.value)
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Experience Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-3xl font-display text-brand-brown">Experience</h3>
          <button
            onClick={() =>
              onResumeChange({
                ...activeResume,
                experience: [
                  ...activeResume.experience,
                  {
                    role: "",
                    company: "",
                    location: "",
                    start_date: "",
                    end_date: "",
                    current: false,
                    description: "",
                    bullets: []
                  }
                ]
              })
            }
            className="text-brand-orange hover:text-brand-orange/80 font-display flex items-center gap-1 transition-colors"
          >
            <Plus size={20} /> Add Experience
          </button>
        </div>
        <div className="grid gap-6">
          {activeResume.experience.map((item, index) => {
            const hasDescription = Boolean(item.description?.trim());
            const hasBullets = item.bullets.some((bullet) => bullet.trim().length > 0);
            return (
              <div key={`${item.company || "experience"}-${index}`} className="cute-card p-8 bg-white space-y-6">
                <div className="flex justify-between items-center border-b-2 border-brand-brown/10 pb-4">
                  <h4 className="text-xl font-display text-brand-orange">Experience {index + 1}</h4>
                  <button
                    onClick={() => {
                      const next = activeResume.experience.filter((_, itemIndex) => itemIndex !== index);
                      onResumeChange({ ...activeResume, experience: next });
                    }}
                    className="text-red-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {(
                    [
                      ["role", "Role"],
                      ["company", "Company"],
                      ["location", "Location"],
                      ["start_date", "Start Date"],
                      ["end_date", "End Date"]
                    ] as Array<[keyof typeof item, string]>
                  ).map(([field, label]) => (
                    <div key={field} className="flex flex-col gap-1">
                      <span className="text-sm font-display text-gray-500 ml-2">{label}</span>
                      <input
                        className="cute-input w-full"
                        value={(item[field] as string | null | undefined) ?? ""}
                        onChange={(event) => {
                          const next = [...activeResume.experience];
                          next[index] = { ...item, [field]: event.target.value };
                          onResumeChange({ ...activeResume, experience: next });
                        }}
                      />
                    </div>
                  ))}
                </div>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded-lg border-2 border-brand-brown text-brand-orange focus:ring-brand-orange"
                    checked={Boolean(item.current)}
                    onChange={(event) => {
                      const next = [...activeResume.experience];
                      next[index] = { ...item, current: event.target.checked };
                      onResumeChange({ ...activeResume, experience: next });
                    }}
                  />
                  <span className="font-display text-gray-600 group-hover:text-brand-orange transition-colors">Current Role</span>
                </label>
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 italic">Choose one: description or bullets.</p>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-display text-gray-500 ml-2">Description</span>
                    <textarea
                      className="cute-input w-full h-24 resize-none disabled:opacity-50"
                      value={item.description ?? ""}
                      disabled={hasBullets}
                      onChange={(event) => {
                        const next = [...activeResume.experience];
                        next[index] = {
                          ...item,
                          description: event.target.value,
                          bullets: event.target.value.trim() ? [] : item.bullets
                        };
                        onResumeChange({ ...activeResume, experience: next });
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-display text-gray-500 ml-2">Bullets (one per line)</span>
                    <textarea
                      className="cute-input w-full h-32 resize-none disabled:opacity-50"
                      value={item.bullets.join("\n")}
                      disabled={hasDescription}
                      onChange={(event) => {
                        const nextBullets = toNonEmptyLines(event.target.value);
                        const next = [...activeResume.experience];
                        next[index] = {
                          ...item,
                          bullets: nextBullets,
                          description: nextBullets.length > 0 ? "" : item.description
                        };
                        onResumeChange({ ...activeResume, experience: next });
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Education Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-3xl font-display text-brand-brown">Education</h3>
          <button
            onClick={() =>
              onResumeChange({
                ...activeResume,
                education: [
                  ...activeResume.education,
                  {
                    degree: "",
                    field: "",
                    institution: "",
                    location: "",
                    start_year: "",
                    end_year: "",
                    gpa: ""
                  }
                ]
              })
            }
            className="text-brand-orange hover:text-brand-orange/80 font-display flex items-center gap-1 transition-colors"
          >
            <Plus size={20} /> Add Education
          </button>
        </div>
        <div className="grid gap-6">
          {activeResume.education.map((item, index) => (
            <div key={`${item.institution || "education"}-${index}`} className="cute-card p-8 bg-white space-y-6">
              <div className="flex justify-between items-center border-b-2 border-brand-brown/10 pb-4">
                <h4 className="text-xl font-display text-brand-orange">Education {index + 1}</h4>
                <button
                  onClick={() => {
                    const next = activeResume.education.filter((_, itemIndex) => itemIndex !== index);
                    onResumeChange({ ...activeResume, education: next });
                  }}
                  className="text-red-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {(
                  [
                    ["degree", "Degree"],
                    ["field", "Field"],
                    ["institution", "Institution"],
                    ["location", "Location"],
                    ["start_year", "Start Year"],
                    ["end_year", "End Year"],
                    ["gpa", "GPA"]
                  ] as Array<[keyof typeof item, string]>
                ).map(([field, label]) => (
                  <div key={field} className="flex flex-col gap-1">
                    <span className="text-sm font-display text-gray-500 ml-2">{label}</span>
                    <input
                      className="cute-input w-full"
                      value={(item[field] as string | null | undefined) ?? ""}
                      onChange={(event) => {
                        const next = [...activeResume.education];
                        next[index] = { ...item, [field]: event.target.value };
                        onResumeChange({ ...activeResume, education: next });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Projects Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-3xl font-display text-brand-brown">Projects</h3>
          <button
            onClick={() =>
              onResumeChange({
                ...activeResume,
                projects: [
                  ...activeResume.projects,
                  {
                    title: "",
                    description: "",
                    start_date: "",
                    end_date: "",
                    technologies: [],
                    bullets: [],
                    link: ""
                  }
                ]
              })
            }
            className="text-brand-orange hover:text-brand-orange/80 font-display flex items-center gap-1 transition-colors"
          >
            <Plus size={20} /> Add Project
          </button>
        </div>
        <div className="grid gap-6">
          {activeResume.projects.map((item, index) => {
            const hasDescription = Boolean(item.description?.trim());
            const hasBullets = item.bullets.some((bullet) => bullet.trim().length > 0);
            return (
              <div key={`${item.title || "project"}-${index}`} className="cute-card p-8 bg-white space-y-6">
                <div className="flex justify-between items-center border-b-2 border-brand-brown/10 pb-4">
                  <h4 className="text-xl font-display text-brand-orange">Project {index + 1}</h4>
                  <button
                    onClick={() => {
                      const next = activeResume.projects.filter((_, itemIndex) => itemIndex !== index);
                      onResumeChange({ ...activeResume, projects: next });
                    }}
                    className="text-red-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {(
                    [
                      ["title", "Title"],
                      ["link", "Link"],
                      ["start_date", "Start Date"],
                      ["end_date", "End Date"]
                    ] as Array<[keyof typeof item, string]>
                  ).map(([field, label]) => (
                    <div key={field} className="flex flex-col gap-1">
                      <span className="text-sm font-display text-gray-500 ml-2">{label}</span>
                      <div className="relative">
                        <input
                          className="cute-input w-full pr-10"
                          value={(item[field] as string | null | undefined) ?? ""}
                          onChange={(event) => {
                            const next = [...activeResume.projects];
                            next[index] = { ...item, [field]: event.target.value };
                            onResumeChange({ ...activeResume, projects: next });
                          }}
                        />
                        {field === "link" && item.link?.trim() && (
                          <a
                            href={toExternalUrl(item.link)}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-orange hover:scale-110 transition-transform"
                          >
                            <ExternalLink size={18} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-display text-gray-500 ml-2">Technologies (comma separated)</span>
                  <textarea
                    className="cute-input w-full h-20 resize-none"
                    value={item.technologies.join(", ")}
                    onChange={(event) => {
                      const next = [...activeResume.projects];
                      next[index] = {
                        ...item,
                        technologies: event.target.value
                          .split(",")
                          .map((entry) => entry.trim())
                          .filter(Boolean)
                      };
                      onResumeChange({ ...activeResume, projects: next });
                    }}
                  />
                </div>
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 italic">Choose one: description or bullets.</p>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-display text-gray-500 ml-2">Description</span>
                    <textarea
                      className="cute-input w-full h-24 resize-none disabled:opacity-50"
                      value={item.description ?? ""}
                      disabled={hasBullets}
                      onChange={(event) => {
                        const next = [...activeResume.projects];
                        next[index] = {
                          ...item,
                          description: event.target.value,
                          bullets: event.target.value.trim() ? [] : item.bullets
                        };
                        onResumeChange({ ...activeResume, projects: next });
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-display text-gray-500 ml-2">Bullets (one per line)</span>
                    <textarea
                      className="cute-input w-full h-32 resize-none disabled:opacity-50"
                      value={item.bullets.join("\n")}
                      disabled={hasDescription}
                      onChange={(event) => {
                        const nextBullets = toNonEmptyLines(event.target.value);
                        const next = [...activeResume.projects];
                        next[index] = {
                          ...item,
                          bullets: nextBullets,
                          description: nextBullets.length > 0 ? "" : item.description
                        };
                        onResumeChange({ ...activeResume, projects: next });
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compact Sections */}
      <div className="space-y-8">
        <h3 className="text-3xl font-display text-brand-brown">Additional Sections</h3>
        <div className="grid md:grid-cols-2 gap-8">
          {COMPACT_SECTION_CONFIG.map(({ key, label }) => (
            <div key={key} className="cute-card p-8 bg-white space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-2xl font-display text-brand-orange">{label}</h4>
                <button
                  onClick={() =>
                    onResumeChange({
                      ...activeResume,
                      [key]: [...activeResume[key], { description: "", date: "", link: "" }]
                    })
                  }
                  className="text-brand-orange hover:text-brand-orange/80 transition-colors"
                >
                  <Plus size={24} />
                </button>
              </div>
              <div className="space-y-4">
                {activeResume[key].map((item, index) => (
                  <div key={`${key}-${index}`} className="p-4 bg-brand-cream/20 rounded-2xl border-2 border-brand-brown/5 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-display text-brand-brown/60">Item {index + 1}</span>
                      <button
                        onClick={() => {
                          const next = activeResume[key].filter((_, itemIndex) => itemIndex !== index);
                          onResumeChange({
                            ...activeResume,
                            [key]: next
                          });
                        }}
                        className="text-red-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-display text-gray-500 ml-2">Description</span>
                        <input
                          className="cute-input w-full text-sm"
                          value={item.description ?? ""}
                          onChange={(event) => {
                            const next = [...activeResume[key]];
                            next[index] = {
                              ...item,
                              description: event.target.value
                            };
                            onResumeChange({
                              ...activeResume,
                              [key]: next
                            });
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-display text-gray-500 ml-2">Date</span>
                          <input
                            className="cute-input w-full text-sm"
                            value={item.date ?? ""}
                            onChange={(event) => {
                              const next = [...activeResume[key]];
                              next[index] = {
                                ...item,
                                date: event.target.value
                              };
                              onResumeChange({
                                ...activeResume,
                                [key]: next
                              });
                            }}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-display text-gray-500 ml-2">Link</span>
                          <div className="relative">
                            <input
                              className="cute-input w-full text-sm pr-8"
                              value={item.link ?? ""}
                              onChange={(event) => {
                                const next = [...activeResume[key]];
                                next[index] = {
                                  ...item,
                                  link: event.target.value
                                };
                                onResumeChange({
                                  ...activeResume,
                                  [key]: next
                                });
                              }}
                            />
                            {item.link?.trim() && (
                              <a
                                href={toExternalUrl(item.link)}
                                target="_blank"
                                rel="noreferrer"
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-orange"
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Render Options & Raw JSON */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="cute-card p-8 bg-white space-y-8">
          <h3 className="text-2xl font-display text-brand-brown flex items-center gap-2">
            <Settings size={24} /> Render Options
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-display text-gray-500 ml-2">Template</span>
              <select 
                className="cute-input w-full appearance-none bg-white"
                value={template} 
                onChange={(event) => onTemplateChange(event.target.value)}
              >
                {TEMPLATE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-display text-gray-500 ml-2">Font Size</span>
              <input
                type="number"
                min={9}
                max={14}
                className="cute-input w-full"
                value={options.font_size}
                onChange={(event) =>
                  onOptionsChange({
                    ...options,
                    font_size: Number(event.target.value)
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-display text-gray-500 ml-2">Margin</span>
              <input
                className="cute-input w-full"
                value={options.margin}
                onChange={(event) =>
                  onOptionsChange({
                    ...options,
                    margin: event.target.value
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-display text-gray-500 ml-2">Max Bullets/Job</span>
              <input
                type="number"
                min={1}
                max={8}
                className="cute-input w-full"
                value={options.max_bullets_per_job}
                onChange={(event) =>
                  onOptionsChange({
                    ...options,
                    max_bullets_per_job: Number(event.target.value)
                  })
                }
              />
            </div>
          </div>

          <div className="p-6 bg-brand-cream/20 rounded-2xl border-2 border-brand-brown/5 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xl font-display text-brand-brown">Section Manager</h4>
              <button 
                onClick={() => setSectionModalOpen(true)}
                className="text-brand-orange hover:scale-110 transition-transform"
              >
                <Settings size={24} />
              </button>
            </div>
            <p className="text-sm text-gray-500 italic">Toggle visibility and drag to reorder sections.</p>
            <div className="flex flex-wrap gap-2">
              {sectionOrder.map((section) => (
                <span 
                  key={section} 
                  className={`px-3 py-1 rounded-full text-xs font-display border-2 transition-colors ${
                    hiddenSections.includes(section) 
                      ? 'bg-gray-100 text-gray-400 border-gray-200' 
                      : 'bg-brand-orange/10 text-brand-orange border-brand-orange/20'
                  }`}
                >
                  {sectionLabelMap.get(section)}
                </span>
              ))}
            </div>
            <button 
              onClick={onShowAllSections}
              className="text-sm font-display text-brand-orange hover:underline"
            >
              Show All Sections
            </button>
          </div>

          <button 
            onClick={onRender} 
            disabled={rendering}
            className={`cute-button w-full flex items-center justify-center gap-2 ${rendering ? 'opacity-50' : ''}`}
          >
            {rendering ? (
              <>Rendering...</>
            ) : (
              <>
                <Sparkles size={20} /> Render PDF
              </>
            )}
          </button>
          {renderError && <p className="text-center text-red-500 font-display text-sm">{renderError}</p>}
        </div>

        <div className="cute-card p-8 bg-white space-y-6">
          <h3 className="text-2xl font-display text-brand-brown flex items-center gap-2">
            <FileJson size={24} /> Raw JSON
          </h3>
          <textarea
            className="cute-input w-full h-96 font-mono text-sm resize-none"
            value={jsonDraft}
            onChange={(event) => setJsonDraft(event.target.value)}
          />
          <div className="flex flex-col gap-4">
            <button
              onClick={() => {
                try {
                  const parsed = JSON.parse(jsonDraft) as Resume;
                  onResumeChange(parsed);
                  setJsonError("");
                } catch (error) {
                  setJsonError(error instanceof Error ? error.message : "Invalid JSON.");
                }
              }}
              className="cute-button-secondary w-full"
            >
              Apply JSON Changes
            </button>
            {jsonError && <p className="text-center text-red-500 font-display text-sm">{jsonError}</p>}
          </div>
        </div>
      </div>

      {/* Section Manager Modal */}
      <AnimatePresence>
        {sectionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSectionModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="cute-card bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative z-10"
            >
              <div className="p-6 border-b-4 border-brand-brown/10 flex justify-between items-center bg-brand-cream/10">
                <h3 className="text-3xl font-display text-brand-brown">Section Manager</h3>
                <button 
                  onClick={() => setSectionModalOpen(false)}
                  className="bg-white border-2 border-brand-brown p-2 rounded-full hover:scale-110 transition-transform"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Tabs */}
                <div className="w-64 border-r-4 border-brand-brown/10 p-4 space-y-2 overflow-y-auto bg-brand-cream/5">
                  {SECTION_MANAGER_OPTIONS.map((section) => {
                    const isHidden = hiddenSections.includes(section.id);
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveModalSection(section.id)}
                        className={`w-full text-left px-4 py-3 rounded-2xl transition-all font-display flex items-center justify-between group ${
                          activeModalSection === section.id 
                            ? 'bg-brand-orange text-white shadow-[4px_4px_0px_0px_rgba(74,62,62,1)]' 
                            : 'hover:bg-brand-orange/10 text-brand-brown'
                        }`}
                      >
                        <span>{section.label}</span>
                        {isHidden ? <EyeOff size={16} className="opacity-50" /> : <Eye size={16} className="opacity-50" />}
                      </button>
                    );
                  })}
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 overflow-y-auto space-y-8">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="text-2xl font-display text-brand-brown">
                        {sectionLabelMap.get(activeModalSection)}
                      </h4>
                      <p className="text-gray-500 italic">Configure visibility and order for this section.</p>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => onToggleSection(activeModalSection)}
                        className="cute-button-secondary px-6 py-2 flex items-center gap-2"
                      >
                        {hiddenSections.includes(activeModalSection) ? <><Eye size={18} /> Show</> : <><EyeOff size={18} /> Hide</>}
                      </button>
                      <button 
                        onClick={onShowAllSections}
                        className="text-brand-orange font-display hover:underline"
                      >
                        Show All
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-xl font-display text-brand-brown flex items-center gap-2">
                      <GripVertical size={20} className="text-brand-orange" /> Drag to Reorder
                    </h5>
                    <ul className="space-y-3">
                      {sectionOrder.map((section) => (
                        <li
                          key={section}
                          draggable
                          onDragStart={() => setDraggingSection(section)}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => {
                            if (draggingSection) {
                              onSectionOrderChange(reorderSections(sectionOrder, draggingSection, section));
                            }
                            setDraggingSection(null);
                          }}
                          onDragEnd={() => setDraggingSection(null)}
                          className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-move group ${
                            draggingSection === section 
                              ? 'bg-brand-orange/20 border-brand-orange scale-95' 
                              : 'bg-white border-brand-brown/10 hover:border-brand-orange/30'
                          } ${hiddenSections.includes(section) ? 'opacity-50 grayscale' : ''}`}
                        >
                          <div className="flex items-center gap-4">
                            <GripVertical size={20} className="text-brand-brown/20 group-hover:text-brand-orange transition-colors" />
                            <span className="font-display text-lg">{sectionLabelMap.get(section)}</span>
                          </div>
                          {hiddenSections.includes(section) && (
                            <span className="text-xs font-display bg-gray-100 text-gray-400 px-2 py-1 rounded-lg">Hidden</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <MasterDetailEditModal
        open={masterEditorOpen}
        onClose={() => setMasterEditorOpen(false)}
        resume={activeResume}
        onResumeChange={onResumeChange}
      />
    </div>
  );
}
````

## File: ResumeKitty/components/MasterDetailEditModal.tsx
````typescript
'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ExternalLink, Plus, Sparkles, Trash2, X } from 'lucide-react';

import { Resume, ResumeSectionKey, SkillCategory } from '@/types/resume';

type EditorSectionKey = 'header' | ResumeSectionKey;
type CompactSectionKey = 'certifications' | 'awards' | 'leadership' | 'extracurricular';

type MasterDetailEditModalProps = {
  open: boolean;
  onClose: () => void;
  resume: Resume;
  onResumeChange: (resume: Resume) => void;
};

const SECTION_ITEMS: Array<{ id: EditorSectionKey; label: string; description: string }> = [
  { id: 'header', label: 'Header', description: 'Name, title, and contact links.' },
  { id: 'summary', label: 'Summary', description: 'Top-line positioning statement.' },
  { id: 'skills', label: 'Skills', description: 'Flat or grouped skills.' },
  { id: 'experience', label: 'Experience', description: 'Roles, bullets, and impact.' },
  { id: 'education', label: 'Education', description: 'Degrees, schools, and years.' },
  { id: 'projects', label: 'Projects', description: 'Projects, links, and technologies.' },
  { id: 'certifications', label: 'Certifications', description: 'Short credential items.' },
  { id: 'awards', label: 'Awards', description: 'Short award and achievement items.' },
  { id: 'leadership', label: 'Leadership', description: 'Leadership and responsibility items.' },
  { id: 'extracurricular', label: 'Extracurricular', description: 'Activities, volunteering, and competitions.' },
];

const LINK_HEADER_FIELDS: Array<keyof Resume['header']> = ['linkedin', 'github', 'website', 'portfolio'];

function updateHeader(resume: Resume, field: keyof Resume['header'], value: string): Resume {
  return {
    ...resume,
    header: {
      ...resume.header,
      [field]: value,
    },
  };
}

function skillsToText(skills: Resume['skills']): string {
  if (!skills || skills.length === 0) {
    return '';
  }

  if (typeof skills[0] === 'string') {
    return (skills as string[]).join('\n');
  }

  return (skills as SkillCategory[])
    .map((entry) => `${entry.category}: ${entry.items.join(', ')}`)
    .join('\n');
}

function textToSkills(value: string): Resume['skills'] {
  const lines = value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.every((line) => !line.includes(':'))) {
    return lines;
  }

  return lines.map((line) => {
    const [category, items] = line.split(':');
    return {
      category: (category || '').trim(),
      items: (items || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    };
  });
}

function toExternalUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('mailto:') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  if (trimmed.includes('@') && !trimmed.includes(' ')) {
    return `mailto:${trimmed}`;
  }

  return `https://${trimmed}`;
}

function toNonEmptyLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function MasterDetailEditModal({
  open,
  onClose,
  resume,
  onResumeChange,
}: MasterDetailEditModalProps) {
  const [activeSection, setActiveSection] = useState<EditorSectionKey>('header');

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function renderHeaderSection() {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-3xl font-display text-brand-brown">Header</h3>
          <p className="text-sm text-gray-600">Edit identity and contact details without leaving the modal.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {(
            [
              ['name', 'Name'],
              ['title', 'Title'],
              ['email', 'Email'],
              ['phone', 'Phone'],
              ['location', 'Location'],
              ['linkedin', 'LinkedIn'],
              ['github', 'GitHub'],
              ['website', 'Website'],
              ['portfolio', 'Portfolio'],
            ] as Array<[keyof Resume['header'], string]>
          ).map(([field, label]) => {
            const currentValue = resume.header[field] ?? '';
            const showLink = LINK_HEADER_FIELDS.includes(field) && currentValue.trim().length > 0;

            return (
              <label key={field} className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-brand-brown">{label}</span>
                <div className="relative">
                  <input
                    className="cute-input w-full pr-10"
                    value={currentValue}
                    onChange={(event) => onResumeChange(updateHeader(resume, field, event.target.value))}
                  />
                  {showLink ? (
                    <a
                      href={toExternalUrl(currentValue)}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-orange transition-transform hover:scale-110"
                      aria-label={`Open ${label}`}
                    >
                      <ExternalLink size={18} />
                    </a>
                  ) : null}
                </div>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  function renderSummarySection() {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-3xl font-display text-brand-brown">Summary</h3>
          <p className="text-sm text-gray-600">Keep this short and tailored to the role.</p>
        </div>

        <textarea
          className="cute-input min-h-[260px] w-full resize-y text-sm leading-6"
          value={resume.summary ?? ''}
          onChange={(event) =>
            onResumeChange({
              ...resume,
              summary: event.target.value,
            })
          }
        />
      </div>
    );
  }

  function renderSkillsSection() {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-3xl font-display text-brand-brown">Skills</h3>
          <p className="text-sm text-gray-600">Use one skill per line or grouped lines like `Frontend: React, Next.js`.</p>
        </div>

        <textarea
          className="cute-input min-h-[260px] w-full resize-y font-mono text-sm leading-6"
          value={skillsToText(resume.skills)}
          onChange={(event) =>
            onResumeChange({
              ...resume,
              skills: textToSkills(event.target.value),
            })
          }
        />
      </div>
    );
  }

  function renderExperienceSection() {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h3 className="text-3xl font-display text-brand-brown">Experience</h3>
            <p className="text-sm text-gray-600">The detail pane scrolls independently as you add more roles.</p>
          </div>

          <button
            type="button"
            onClick={() =>
              onResumeChange({
                ...resume,
                experience: [
                  ...resume.experience,
                  {
                    role: '',
                    company: '',
                    location: '',
                    start_date: '',
                    end_date: '',
                    current: false,
                    description: '',
                    bullets: [],
                  },
                ],
              })
            }
            className="cute-button-secondary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm"
          >
            <Plus size={16} />
            Add role
          </button>
        </div>

        <div className="grid gap-6">
          {resume.experience.map((item, index) => (
            <div
              key={`${item.company || 'experience'}-${index}`}
              className="rounded-3xl border-4 border-brand-brown bg-white p-6 shadow-[4px_4px_0px_0px_rgba(74,62,62,1)]"
            >
              <div className="flex items-center justify-between gap-4 border-b-2 border-brand-brown/10 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-brown/60">Role</p>
                  <h4 className="mt-1 text-xl font-display text-brand-orange">
                    {item.role?.trim() ? item.role : `Experience ${index + 1}`}
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onResumeChange({
                      ...resume,
                      experience: resume.experience.filter((_, itemIndex) => itemIndex !== index),
                    })
                  }
                  className="rounded-2xl border-2 border-brand-brown/10 bg-brand-cream p-2 text-brand-brown/60 transition hover:text-red-500"
                  aria-label="Delete experience item"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {(
                  [
                    ['role', 'Role'],
                    ['company', 'Company'],
                    ['location', 'Location'],
                    ['start_date', 'Start Date'],
                    ['end_date', 'End Date'],
                  ] as Array<[keyof typeof item, string]>
                ).map(([field, label]) => (
                  <label key={field} className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-brand-brown">{label}</span>
                    <input
                      className="cute-input w-full"
                      value={(item[field] as string | null | undefined) ?? ''}
                      onChange={(event) => {
                        const next = [...resume.experience];
                        next[index] = { ...item, [field]: event.target.value };
                        onResumeChange({ ...resume, experience: next });
                      }}
                    />
                  </label>
                ))}
              </div>

              <label className="mt-5 flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded-lg border-2 border-brand-brown text-brand-orange focus:ring-brand-orange"
                  checked={Boolean(item.current)}
                  onChange={(event) => {
                    const next = [...resume.experience];
                    next[index] = { ...item, current: event.target.checked };
                    onResumeChange({ ...resume, experience: next });
                  }}
                />
                <span className="text-sm font-semibold text-gray-600">Current role</span>
              </label>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-brand-brown">Description</span>
                  <textarea
                    className="cute-input min-h-[120px] w-full resize-y text-sm leading-6"
                    value={item.description ?? ''}
                    onChange={(event) => {
                      const next = [...resume.experience];
                      next[index] = { ...item, description: event.target.value };
                      onResumeChange({ ...resume, experience: next });
                    }}
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-brand-brown">Bullets (one per line)</span>
                  <textarea
                    className="cute-input min-h-[120px] w-full resize-y font-mono text-sm leading-6"
                    value={item.bullets.join('\n')}
                    onChange={(event) => {
                      const next = [...resume.experience];
                      next[index] = {
                        ...item,
                        bullets: toNonEmptyLines(event.target.value),
                      };
                      onResumeChange({ ...resume, experience: next });
                    }}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderEducationSection() {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h3 className="text-3xl font-display text-brand-brown">Education</h3>
            <p className="text-sm text-gray-600">Degrees, institutions, and time range in a single scrollable detail pane.</p>
          </div>

          <button
            type="button"
            onClick={() =>
              onResumeChange({
                ...resume,
                education: [
                  ...resume.education,
                  {
                    degree: '',
                    field: '',
                    institution: '',
                    location: '',
                    start_year: '',
                    end_year: '',
                    gpa: '',
                  },
                ],
              })
            }
            className="cute-button-secondary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm"
          >
            <Plus size={16} />
            Add education
          </button>
        </div>

        <div className="grid gap-6">
          {resume.education.map((item, index) => (
            <div
              key={`${item.institution || 'education'}-${index}`}
              className="rounded-3xl border-4 border-brand-brown bg-white p-6 shadow-[4px_4px_0px_0px_rgba(74,62,62,1)]"
            >
              <div className="flex items-center justify-between gap-4 border-b-2 border-brand-brown/10 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-brown/60">Education</p>
                  <h4 className="mt-1 text-xl font-display text-brand-orange">
                    {item.institution?.trim() ? item.institution : `Education ${index + 1}`}
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onResumeChange({
                      ...resume,
                      education: resume.education.filter((_, itemIndex) => itemIndex !== index),
                    })
                  }
                  className="rounded-2xl border-2 border-brand-brown/10 bg-brand-cream p-2 text-brand-brown/60 transition hover:text-red-500"
                  aria-label="Delete education item"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {(
                  [
                    ['degree', 'Degree'],
                    ['field', 'Field'],
                    ['institution', 'Institution'],
                    ['location', 'Location'],
                    ['start_year', 'Start Year'],
                    ['end_year', 'End Year'],
                    ['gpa', 'GPA'],
                  ] as Array<[keyof typeof item, string]>
                ).map(([field, label]) => (
                  <label key={field} className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-brand-brown">{label}</span>
                    <input
                      className="cute-input w-full"
                      value={(item[field] as string | null | undefined) ?? ''}
                      onChange={(event) => {
                        const next = [...resume.education];
                        next[index] = { ...item, [field]: event.target.value };
                        onResumeChange({ ...resume, education: next });
                      }}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderProjectsSection() {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h3 className="text-3xl font-display text-brand-brown">Projects</h3>
            <p className="text-sm text-gray-600">Project cards keep links, technologies, and bullets in one place.</p>
          </div>

          <button
            type="button"
            onClick={() =>
              onResumeChange({
                ...resume,
                projects: [
                  ...resume.projects,
                  {
                    title: '',
                    description: '',
                    start_date: '',
                    end_date: '',
                    technologies: [],
                    bullets: [],
                    link: '',
                  },
                ],
              })
            }
            className="cute-button-secondary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm"
          >
            <Plus size={16} />
            Add project
          </button>
        </div>

        <div className="grid gap-6">
          {resume.projects.map((item, index) => (
            <div
              key={`${item.title || 'project'}-${index}`}
              className="rounded-3xl border-4 border-brand-brown bg-white p-6 shadow-[4px_4px_0px_0px_rgba(74,62,62,1)]"
            >
              <div className="flex items-center justify-between gap-4 border-b-2 border-brand-brown/10 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-brown/60">Project</p>
                  <h4 className="mt-1 text-xl font-display text-brand-orange">
                    {item.title?.trim() ? item.title : `Project ${index + 1}`}
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onResumeChange({
                      ...resume,
                      projects: resume.projects.filter((_, itemIndex) => itemIndex !== index),
                    })
                  }
                  className="rounded-2xl border-2 border-brand-brown/10 bg-brand-cream p-2 text-brand-brown/60 transition hover:text-red-500"
                  aria-label="Delete project item"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {(
                  [
                    ['title', 'Title'],
                    ['start_date', 'Start Date'],
                    ['end_date', 'End Date'],
                  ] as Array<[keyof typeof item, string]>
                ).map(([field, label]) => (
                  <label key={field} className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-brand-brown">{label}</span>
                    <input
                      className="cute-input w-full"
                      value={(item[field] as string | null | undefined) ?? ''}
                      onChange={(event) => {
                        const next = [...resume.projects];
                        next[index] = { ...item, [field]: event.target.value };
                        onResumeChange({ ...resume, projects: next });
                      }}
                    />
                  </label>
                ))}

                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-sm font-semibold text-brand-brown">Project link</span>
                  <div className="relative">
                    <input
                      className="cute-input w-full pr-10"
                      value={item.link ?? ''}
                      onChange={(event) => {
                        const next = [...resume.projects];
                        next[index] = { ...item, link: event.target.value };
                        onResumeChange({ ...resume, projects: next });
                      }}
                    />
                    {item.link?.trim() ? (
                      <a
                        href={toExternalUrl(item.link)}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-orange transition-transform hover:scale-110"
                        aria-label="Open project link"
                      >
                        <ExternalLink size={18} />
                      </a>
                    ) : null}
                  </div>
                </label>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-brand-brown">Description</span>
                  <textarea
                    className="cute-input min-h-[120px] w-full resize-y text-sm leading-6"
                    value={item.description ?? ''}
                    onChange={(event) => {
                      const next = [...resume.projects];
                      next[index] = { ...item, description: event.target.value };
                      onResumeChange({ ...resume, projects: next });
                    }}
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-brand-brown">Bullets (one per line)</span>
                  <textarea
                    className="cute-input min-h-[120px] w-full resize-y font-mono text-sm leading-6"
                    value={item.bullets.join('\n')}
                    onChange={(event) => {
                      const next = [...resume.projects];
                      next[index] = {
                        ...item,
                        bullets: toNonEmptyLines(event.target.value),
                      };
                      onResumeChange({ ...resume, projects: next });
                    }}
                  />
                </label>
              </div>

              <label className="mt-5 flex flex-col gap-2">
                <span className="text-sm font-semibold text-brand-brown">Technologies</span>
                <textarea
                  className="cute-input min-h-[110px] w-full resize-y font-mono text-sm leading-6"
                  value={item.technologies.join('\n')}
                  onChange={(event) => {
                    const next = [...resume.projects];
                    next[index] = {
                      ...item,
                      technologies: toNonEmptyLines(event.target.value),
                    };
                    onResumeChange({ ...resume, projects: next });
                  }}
                />
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderCompactSection(section: CompactSectionKey) {
    const labels: Record<CompactSectionKey, string> = {
      certifications: 'Certifications',
      awards: 'Achievements / Awards',
      leadership: 'Leadership / Responsibilities',
      extracurricular: 'Extracurricular Activities',
    };

    const items = resume[section];

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h3 className="text-3xl font-display text-brand-brown">{labels[section]}</h3>
            <p className="text-sm text-gray-600">Use these compact cards for short items, dates, and optional links.</p>
          </div>

          <button
            type="button"
            onClick={() =>
              onResumeChange({
                ...resume,
                [section]: [...items, { description: '', date: '', link: '' }],
              })
            }
            className="cute-button-secondary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm"
          >
            <Plus size={16} />
            Add item
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {items.map((item, index) => (
            <div
              key={`${section}-${index}`}
              className="rounded-3xl border-4 border-brand-brown bg-white p-6 shadow-[4px_4px_0px_0px_rgba(74,62,62,1)]"
            >
              <div className="flex items-center justify-between gap-4 border-b-2 border-brand-brown/10 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-brown/60">Item</p>
                  <h4 className="mt-1 text-xl font-display text-brand-orange">Entry {index + 1}</h4>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onResumeChange({
                      ...resume,
                      [section]: items.filter((_, itemIndex) => itemIndex !== index),
                    })
                  }
                  className="rounded-2xl border-2 border-brand-brown/10 bg-brand-cream p-2 text-brand-brown/60 transition hover:text-red-500"
                  aria-label={`Delete ${labels[section]} item`}
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-brand-brown">Description</span>
                  <textarea
                    className="cute-input min-h-[140px] w-full resize-y text-sm leading-6"
                    value={item.description ?? ''}
                    onChange={(event) => {
                      const next = [...items];
                      next[index] = {
                        ...item,
                        description: event.target.value,
                      };
                      onResumeChange({ ...resume, [section]: next });
                    }}
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-brand-brown">Date</span>
                    <input
                      className="cute-input w-full"
                      value={item.date ?? ''}
                      onChange={(event) => {
                        const next = [...items];
                        next[index] = {
                          ...item,
                          date: event.target.value,
                        };
                        onResumeChange({ ...resume, [section]: next });
                      }}
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-brand-brown">Link</span>
                    <div className="relative">
                      <input
                        className="cute-input w-full pr-10"
                        value={item.link ?? ''}
                        onChange={(event) => {
                          const next = [...items];
                          next[index] = {
                            ...item,
                            link: event.target.value,
                          };
                          onResumeChange({ ...resume, [section]: next });
                        }}
                      />
                      {item.link?.trim() ? (
                        <a
                          href={toExternalUrl(item.link)}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-orange transition-transform hover:scale-110"
                          aria-label="Open link"
                        >
                          <ExternalLink size={18} />
                        </a>
                      ) : null}
                    </div>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderActiveSection() {
    if (activeSection === 'header') return renderHeaderSection();
    if (activeSection === 'summary') return renderSummarySection();
    if (activeSection === 'skills') return renderSkillsSection();
    if (activeSection === 'experience') return renderExperienceSection();
    if (activeSection === 'education') return renderEducationSection();
    if (activeSection === 'projects') return renderProjectsSection();
    if (
      activeSection === 'certifications' ||
      activeSection === 'awards' ||
      activeSection === 'leadership' ||
      activeSection === 'extracurricular'
    ) {
      return renderCompactSection(activeSection);
    }

    return null;
  }

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-label="Close modal"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            className="cute-card relative z-10 flex w-full max-w-6xl flex-col overflow-hidden bg-white"
            style={{ maxHeight: '90vh' }}
          >
            <div className="flex items-center justify-between gap-4 border-b-4 border-brand-brown/10 bg-brand-cream/20 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full border-2 border-brand-brown bg-white p-2 text-brand-orange shadow-[2px_2px_0px_0px_rgba(74,62,62,1)]">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 className="text-2xl font-display text-brand-brown">Master Detail Editor</h2>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-brown/60">
                    Detail pane scrolls independently
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-full border-2 border-brand-brown bg-white p-2 text-brand-brown transition hover:scale-105"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col md:flex-row">
              <div className="w-full shrink-0 border-b-4 border-brand-brown/10 bg-brand-cream/10 p-4 md:w-72 md:border-b-0 md:border-r-4">
                <div className="flex gap-2 overflow-x-auto md:block md:space-y-2 md:overflow-visible">
                  {SECTION_ITEMS.map((section) => {
                    const isActive = section.id === activeSection;

                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => setActiveSection(section.id)}
                        className={`min-w-[170px] rounded-2xl border-2 px-4 py-3 text-left transition md:w-full md:min-w-0 ${
                          isActive
                            ? 'border-brand-brown bg-white shadow-[4px_4px_0px_0px_rgba(74,62,62,1)]'
                            : 'border-brand-brown/10 bg-white/60 hover:border-brand-brown/30 hover:bg-white'
                        }`}
                      >
                        <p className="text-sm font-display text-brand-brown">{section.label}</p>
                        <p className="mt-1 text-xs leading-5 text-gray-600">{section.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-6 md:p-8">
                <div className="rounded-2xl border-2 border-brand-brown/10 bg-brand-cream/30 px-4 py-3 text-sm text-brand-brown">
                  Use the left rail to switch sections. The right detail page scrolls as items and fields grow.
                </div>

                <div className="mt-6">{renderActiveSection()}</div>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
````

## File: ResumeKitty/components/MatchAssistant.tsx
````typescript
'use client';

import { useState } from 'react';
import { ClipboardCheck, Loader2, Sparkles, Target } from 'lucide-react';

import type { BuilderMode } from '@/types/builder';
import type { MatchResult, MatchSuggestion } from '@/types/match';
import type { Resume } from '@/types/resume';

type MatchAssistantProps = {
  resume: Resume | null;
  activeMode: BuilderMode;
  remainingCredits: number;
  onMatchComplete: () => void;
};

function hasResumeContent(resume: Resume | null): boolean {
  if (!resume) {
    return false;
  }

  return Boolean(
    resume.header.name?.trim() ||
      resume.summary?.trim() ||
      resume.skills.length ||
      resume.experience.length ||
      resume.education.length ||
      resume.projects.length
  );
}

export default function MatchAssistant({
  resume,
  activeMode,
  remainingCredits,
  onMatchComplete,
}: MatchAssistantProps) {
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function requestMatchAnalysis() {
    const response = await fetch('/api/match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resume,
        job_description: jobDescription,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({ detail: 'Match analysis failed.' }));
      throw new Error(payload.detail || 'Match analysis failed.');
    }

    const payload = (await response.json()) as {
      score: number;
      analyzed_keywords: string[];
      matched_keywords: string[];
      missing_keywords: string[];
      suggestions: Array<{
        section: MatchSuggestion['section'];
        title: string;
        detail: string;
      }>;
    };

    return {
      score: payload.score,
      analyzedKeywords: payload.analyzed_keywords,
      matchedKeywords: payload.matched_keywords,
      missingKeywords: payload.missing_keywords,
      suggestions: payload.suggestions,
    } satisfies MatchResult;
  }

  async function handleAnalyze() {
    if (!hasResumeContent(resume)) {
      setError('Add resume content first so the matcher has something to compare.');
      return;
    }

    if (!jobDescription.trim()) {
      setError('Paste a job description to run the match analysis.');
      return;
    }

    if (remainingCredits === 0) {
      setError('No JD match credits remain in this guest session.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const nextResult = await requestMatchAnalysis();
      setResult(nextResult);
      onMatchComplete();
    } catch (matchError) {
      setError(matchError instanceof Error ? matchError.message : 'Match analysis failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cute-card bg-white p-6 md:p-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-brand-orange">
          <Target size={18} />
          JD Match Assistant
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h3 className="text-2xl tracking-tight text-brand-brown">Paste a job description and compare instantly.</h3>
            <p className="text-sm text-gray-600">
              Stay in the same builder, review the score, and edit the left panel against the suggestions.
            </p>
          </div>
          <div className="rounded-2xl border-4 border-brand-brown bg-brand-cream px-4 py-3 text-center shadow-[4px_4px_0px_0px_rgba(74,62,62,1)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-brown/60">Credits left</p>
            <p className="mt-1 text-2xl text-brand-brown">{remainingCredits}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <textarea
          className="cute-input min-h-[180px] w-full resize-y text-sm leading-6"
          value={jobDescription}
          onChange={(event) => {
            setJobDescription(event.target.value);
            if (error) {
              setError('');
            }
          }}
          placeholder="Paste the target job description here."
        />

        <button type="button" className="cute-button w-full" onClick={handleAnalyze}>
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Analyzing...
            </span>
          ) : (
            'Analyze resume match'
          )}
        </button>

        {error ? (
          <p className="rounded-2xl border-4 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </div>

      {result ? (
        <div className="mt-6 space-y-6">
          <div className="rounded-3xl border-4 border-brand-brown bg-brand-green/15 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-brown/60">Match score</p>
                <h4 className="mt-2 text-4xl tracking-tight text-brand-brown">{result.score}%</h4>
              </div>
              <Sparkles className="text-brand-orange" size={30} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border-4 border-brand-brown bg-brand-cream/60 p-5">
              <p className="text-sm font-semibold text-brand-brown">Matched keywords</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.matchedKeywords.length > 0 ? (
                  result.matchedKeywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full border-2 border-brand-green-dark/20 bg-brand-green/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-brown"
                    >
                      {keyword}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No strong overlap yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border-4 border-brand-brown bg-brand-pink/15 p-5">
              <p className="text-sm font-semibold text-brand-brown">Missing keywords</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.missingKeywords.length > 0 ? (
                  result.missingKeywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full border-2 border-brand-pink/30 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-brown"
                    >
                      {keyword}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Great coverage. Focus on polishing phrasing and ordering.</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border-4 border-brand-brown bg-white p-5">
            <div className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-orange">
              <ClipboardCheck size={16} />
              Suggested edits
            </div>
            <div className="space-y-3">
              {result.suggestions.map((suggestion) => (
                <div key={`${suggestion.section}-${suggestion.title}`} className="rounded-2xl bg-brand-cream/50 p-4">
                  <p className="text-sm font-semibold uppercase tracking-wide text-brand-brown/60">
                    {suggestion.section}
                  </p>
                  <h4 className="mt-1 text-lg text-brand-brown">{suggestion.title}</h4>
                  <p className="mt-1 text-sm text-gray-600">{suggestion.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
````

## File: ResumeKitty/components/Navbar.tsx
````typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cat, FileQuestion, FolderHeart, Home, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

const links = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/builder', label: 'Builder', icon: Sparkles },
  { href: '/resumes', label: 'Dashboard', icon: FolderHeart },
  { href: '/help', label: 'Help', icon: FileQuestion },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed left-0 top-0 z-50 w-full border-b-4 border-brand-brown bg-brand-cream/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <motion.div
            whileHover={{ rotate: [0, -10, 10, -10, 0] }}
            className="rounded-full border-2 border-brand-brown bg-white p-1.5 shadow-[2px_2px_0px_0px_rgba(74,62,62,1)]"
          >
            <Cat size={24} className="text-brand-orange" />
          </motion.div>
          <span className="font-display text-2xl tracking-tight text-brand-brown">
            Resume<span className="text-brand-orange">Kitty</span>
          </span>
        </Link>

        <div className="hidden items-center gap-4 md:flex">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-display transition-all ${
                  isActive
                    ? 'bg-brand-brown text-white shadow-[2px_2px_0px_0px_rgba(168,213,186,1)]'
                    : 'text-brand-brown hover:bg-brand-green/20'
                }`}
              >
                <Icon size={16} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex md:hidden">
            <Link href="/builder" className="cute-button-secondary px-3 py-1.5 text-sm">
              Build
            </Link>
            <Link href="/help" className="cute-button-secondary px-3 py-1.5 text-sm">
              Help
            </Link>
          </div>
          <Link href="/builder" className="cute-button px-4 py-1.5 text-sm shadow-[2px_2px_0px_0px_rgba(74,62,62,1)]">
            Start building
          </Link>
        </div>
      </div>
    </nav>
  );
}
````

## File: ResumeKitty/components/PdfPreview.tsx
````typescript
'use client';

import { useEffect, useState } from 'react';
import { Download, FileOutput, Lock } from 'lucide-react';

import DownloadGateModal from '@/components/DownloadGateModal';

type PdfPreviewProps = {
  fileUrl: string | null;
};

export default function PdfPreview({ fileUrl }: PdfPreviewProps) {
  const [width, setWidth] = useState(720);
  const [downloadEmail, setDownloadEmail] = useState(() => {
    if (typeof window === 'undefined') {
      return '';
    }

    return window.localStorage.getItem('resumekitty-download-email') ?? '';
  });
  const [downloadUnlocked, setDownloadUnlocked] = useState(Boolean(downloadEmail));
  const [gateOpen, setGateOpen] = useState(false);

  useEffect(() => {
    function onResize() {
      setWidth(Math.min(window.innerWidth - 96, 720));
    }

    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function triggerDownload() {
    if (!fileUrl) {
      return;
    }

    const anchor = document.createElement('a');
    anchor.href = fileUrl;
    anchor.download = 'resume.pdf';
    anchor.click();
  }

  return (
    <>
      <div className="cute-card sticky top-24 bg-white p-6 md:p-8">
        <div className="mb-6 space-y-2">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-brand-orange">
            <FileOutput size={18} />
            PDF Preview
          </div>
          <h3 className="text-2xl tracking-tight text-brand-brown">Rendered output</h3>
          <p className="text-sm text-gray-600">
            Your compiled resume will appear here as soon as the backend returns the PDF.
          </p>
        </div>

        {fileUrl ? (
          <div className="space-y-6">
            <div className="rounded-3xl border-4 border-brand-brown bg-brand-cream/60 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-brown/60">Export</p>
                  <p className="mt-2 text-sm text-gray-600">
                    Signup is only required when you download. Preview stays open for guests.
                  </p>
                  {downloadUnlocked ? (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-green-dark">
                      Unlocked for {downloadEmail}
                    </p>
                  ) : null}
                </div>
                <Lock className="mt-1 text-brand-orange" size={20} />
              </div>
            </div>

            <button
              type="button"
              className="cute-button inline-flex w-full items-center justify-center gap-2 px-5 py-2 text-base"
              onClick={() => {
                if (downloadUnlocked) {
                  triggerDownload();
                  return;
                }

                setGateOpen(true);
              }}
            >
              <Download size={16} />
              {downloadUnlocked ? 'Download PDF' : 'Unlock download'}
            </button>

            <div className="overflow-hidden rounded-3xl border-4 border-brand-brown bg-brand-cream/50 p-3">
              <iframe
                key={fileUrl}
                src={fileUrl}
                title="Resume PDF preview"
                className="w-full rounded-2xl bg-white"
                style={{ height: Math.max(520, width * 1.25), border: 0 }}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border-4 border-dashed border-brand-brown bg-brand-cream/50 p-10 text-center">
            <p className="text-base font-semibold text-brand-brown">No PDF rendered yet.</p>
            <p className="mt-2 text-sm text-gray-500">
              Upload, parse, and render a resume to preview the compiled document here.
            </p>
          </div>
        )}
      </div>

      <DownloadGateModal
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        onUnlock={({ email }) => {
          window.localStorage.setItem('resumekitty-download-email', email);
          setDownloadUnlocked(true);
          setDownloadEmail(email);
          setGateOpen(false);
          triggerDownload();
        }}
      />
    </>
  );
}
````

## File: ResumeKitty/components/ResumeParser.tsx
````typescript
'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { FileText, LayoutTemplate, Sparkles, Wand2 } from 'lucide-react';

import JsonEditorForm from '@/components/JsonEditorForm';
import MatchAssistant from '@/components/MatchAssistant';
import UploadForm from '@/components/UploadForm';
import { BUILDER_MODE_OPTIONS, BuilderMode } from '@/types/builder';
import {
  RenderOptions,
  Resume,
  ResumeSectionKey,
  TEMPLATE_OPTIONS,
  createEmptyResume,
  defaultRenderOptions,
} from '@/types/resume';

const PdfPreview = dynamic(() => import('@/components/PdfPreview'), { ssr: false });

function applySectionVisibility(resume: Resume, hiddenSections: ResumeSectionKey[]): Resume {
  if (hiddenSections.length === 0) {
    return resume;
  }

  const next = structuredClone(resume);
  const hidden = new Set(hiddenSections);

  if (hidden.has('summary')) next.summary = null;
  if (hidden.has('skills')) next.skills = [];
  if (hidden.has('experience')) next.experience = [];
  if (hidden.has('education')) next.education = [];
  if (hidden.has('projects')) next.projects = [];
  if (hidden.has('certifications')) next.certifications = [];
  if (hidden.has('awards')) next.awards = [];
  if (hidden.has('leadership')) next.leadership = [];
  if (hidden.has('extracurricular')) next.extracurricular = [];

  return next;
}

type ResumeParserProps = {
  initialMode?: BuilderMode;
};

export default function ResumeParser({ initialMode = 'upload' }: ResumeParserProps) {
  const [activeMode, setActiveMode] = useState<BuilderMode>(initialMode);
  const [fileId, setFileId] = useState('');
  const [rawText, setRawText] = useState('');
  const [resume, setResume] = useState<Resume | null>(createEmptyResume());
  const [template, setTemplate] = useState(defaultRenderOptions.template);
  const [options, setOptions] = useState<RenderOptions>(defaultRenderOptions);
  const [parseLoading, setParseLoading] = useState(false);
  const [parseError, setParseError] = useState('');
  const [renderLoading, setRenderLoading] = useState(false);
  const [renderError, setRenderError] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [hiddenSections, setHiddenSections] = useState<ResumeSectionKey[]>([]);
  const [sectionOrder, setSectionOrder] = useState<ResumeSectionKey[]>(defaultRenderOptions.section_order);
  const [credits, setCredits] = useState({ parse: 3, match: 2 });

  useEffect(() => {
    setActiveMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  async function handleParse() {
    if (!rawText.trim()) {
      setParseError('Upload a resume or paste source text before parsing.');
      return;
    }

    if (credits.parse === 0) {
      setParseError('No parse credits remain in this guest session.');
      return;
    }

    setParseLoading(true);
    setParseError('');

    try {
      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: rawText,
          file_id: fileId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Parse failed.' }));
        throw new Error(error.detail || 'Parse failed.');
      }

      const parsedResume = (await response.json()) as Resume;
      setResume(parsedResume);
      setCredits((current) => ({ ...current, parse: Math.max(0, current.parse - 1) }));
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Parse failed.');
    } finally {
      setParseLoading(false);
    }
  }

  async function handleRender() {
    if (!resume) {
      return;
    }

    setRenderLoading(true);
    setRenderError('');

    try {
      const renderResume = applySectionVisibility(resume, hiddenSections);
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume: renderResume,
          template,
          options: {
            ...options,
            section_order: sectionOrder,
            template,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Render failed.' }));
        throw new Error(error.detail || 'Render failed.');
      }

      const blob = await response.blob();
      const nextUrl = URL.createObjectURL(blob);
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      setPdfUrl(nextUrl);
    } catch (error) {
      setRenderError(error instanceof Error ? error.message : 'Render failed.');
    } finally {
      setRenderLoading(false);
    }
  }

  function handleCreateFromScratch() {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }

    const nextSectionOrder = [...defaultRenderOptions.section_order];
    setActiveMode('scratch');
    setFileId('');
    setRawText('');
    setResume(createEmptyResume());
    setTemplate(defaultRenderOptions.template);
    setOptions({ ...defaultRenderOptions, section_order: nextSectionOrder });
    setParseError('');
    setRenderError('');
    setPdfUrl(null);
    setHiddenSections([]);
    setSectionOrder(nextSectionOrder);
  }

  const modeCopy = {
    scratch: {
      title: 'Start with a blank resume and stay in the editor.',
      body: 'Skip upload, fill the structured sections directly, then render whenever you want a fresh preview.',
    },
    upload: {
      title: 'Bring in an existing resume and clean it up here.',
      body: 'Upload a PDF or DOCX, review the extracted text, parse it once, then keep editing in the same workspace.',
    },
    match: {
      title: 'Tailor one resume against a specific role.',
      body: 'Upload or refine your resume, paste the target job description, and compare both without leaving the builder.',
    },
  } as const;

  return (
    <div className="space-y-8 pb-12">
      <section className="cute-card relative overflow-hidden bg-brand-orange/20">
        <div className="absolute -right-6 -top-6 rounded-full bg-brand-pink/40 p-8 blur-xl" />
        <div className="absolute -left-4 bottom-0 rounded-full bg-brand-green/30 p-10 blur-xl" />
        <div className="relative space-y-8 p-2">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.9fr)]">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border-2 border-brand-brown bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-brown shadow-[2px_2px_0px_0px_rgba(74,62,62,1)]">
                <Sparkles size={14} className="text-brand-orange" />
                ResumeKitty Builder
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl tracking-tight text-brand-brown md:text-4xl">
                  {modeCopy[activeMode].title}
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-brand-brown/80 md:text-base">
                  {modeCopy[activeMode].body}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border-4 border-brand-brown bg-white p-4 shadow-[4px_4px_0px_0px_rgba(74,62,62,1)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-brown/60">Guest mode</p>
                <p className="mt-2 text-sm font-medium text-brand-brown">Signup only appears when you download.</p>
              </div>
              <div className="rounded-2xl border-4 border-brand-brown bg-white p-4 shadow-[4px_4px_0px_0px_rgba(74,62,62,1)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-brown/60">Parse credits</p>
                <p className="mt-2 text-2xl font-semibold text-brand-brown">{credits.parse}</p>
              </div>
              <div className="rounded-2xl border-4 border-brand-brown bg-white p-4 shadow-[4px_4px_0px_0px_rgba(74,62,62,1)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-brown/60">JD credits</p>
                <p className="mt-2 text-2xl font-semibold text-brand-brown">{credits.match}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {BUILDER_MODE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setActiveMode(option.id)}
                className={`rounded-3xl border-4 p-5 text-left transition ${
                  activeMode === option.id
                    ? 'border-brand-brown bg-white shadow-[6px_6px_0px_0px_rgba(74,62,62,1)]'
                    : 'border-brand-brown/20 bg-brand-cream/60 hover:border-brand-brown hover:bg-white'
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-brown/60">
                  {option.shortLabel}
                </p>
                <h3 className="mt-2 text-xl text-brand-brown">{option.label}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{option.description}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.95fr)]">
        <div className="space-y-8">
          {activeMode === 'scratch' ? (
            <div className="cute-card bg-white p-6 md:p-8">
              <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-brand-orange">
                    <Sparkles size={18} />
                    Blank Resume
                  </div>
                  <h3 className="text-2xl tracking-tight text-brand-brown">Start typing in the editor below.</h3>
                  <p className="max-w-2xl text-sm text-gray-600">
                    ResumeKitty already prepared an empty resume schema for you. If you want to import a file later,
                    just switch to Upload mode.
                  </p>
                </div>
                <button type="button" className="cute-button-secondary px-5 py-2 text-base" onClick={handleCreateFromScratch}>
                  Reset blank resume
                </button>
              </div>
            </div>
          ) : (
            <UploadForm
              onCreateFromScratch={handleCreateFromScratch}
              onUploaded={({ fileId: nextFileId, text }) => {
                setFileId(nextFileId);
                setRawText(text);
                setParseError('');
              }}
            />
          )}

          <div className="cute-card bg-white p-6 md:p-8">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-brand-orange">
                  <FileText size={18} />
                  {activeMode === 'scratch' ? 'Optional Source Text' : 'Extracted Text'}
                </div>
                <h3 className="text-2xl tracking-tight text-brand-brown">
                  {activeMode === 'scratch' ? 'Paste source text only if you want AI parsing.' : 'Review the source before parsing.'}
                </h3>
                <p className="max-w-2xl text-sm text-gray-600">
                  Adjust the imported text if OCR or extraction is imperfect, then parse it into the canonical resume
                  schema.
                </p>
              </div>
              <button
                type="button"
                className="cute-button inline-flex items-center justify-center gap-2 px-5 py-2 text-base"
                onClick={handleParse}
                disabled={parseLoading || !rawText.trim()}
              >
                <Wand2 size={16} />
                {parseLoading ? 'Parsing...' : 'Parse to JSON'}
              </button>
            </div>

            <textarea
              className="cute-input min-h-[300px] w-full resize-y font-mono text-sm leading-6"
              rows={14}
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              placeholder={
                activeMode === 'scratch'
                  ? 'Optional: paste resume text here if you want ResumeKitty to parse it for you.'
                  : 'Upload a resume to populate extracted text.'
              }
            />

            {parseError ? (
              <p className="mt-4 rounded-2xl border-4 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {parseError}
              </p>
            ) : null}
          </div>

          <div className="cute-card bg-white p-6 md:p-8">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-brand-orange">
                  <LayoutTemplate size={18} />
                  Template quick switch
                </div>
                <h3 className="text-2xl tracking-tight text-brand-brown">Swap layouts without leaving the builder.</h3>
                <p className="max-w-2xl text-sm text-gray-600">
                  Compare templates inline, then use the render controls below for spacing and final output.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {TEMPLATE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setTemplate(option.id);
                    setOptions((current) => ({ ...current, template: option.id }));
                  }}
                  className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition ${
                    template === option.id
                      ? 'border-brand-brown bg-brand-brown text-white'
                      : 'border-brand-brown bg-white text-brand-brown hover:bg-brand-cream'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <JsonEditorForm
            resume={resume}
            options={options}
            template={template}
            onResumeChange={setResume}
            onOptionsChange={setOptions}
            onTemplateChange={(nextTemplate) => {
              setTemplate(nextTemplate);
              setOptions((current) => ({ ...current, template: nextTemplate }));
            }}
            hiddenSections={hiddenSections}
            onToggleSection={(section) =>
              setHiddenSections((current) =>
                current.includes(section)
                  ? current.filter((value) => value !== section)
                  : [...current, section]
              )
            }
            onShowAllSections={() => setHiddenSections([])}
            sectionOrder={sectionOrder}
            onSectionOrderChange={setSectionOrder}
            onRender={handleRender}
            rendering={renderLoading}
            renderError={renderError}
          />
        </div>

        <div className="space-y-8">
          <PdfPreview fileUrl={pdfUrl} />
          <MatchAssistant
            resume={resume}
            activeMode={activeMode}
            remainingCredits={credits.match}
            onMatchComplete={() =>
              setCredits((current) => ({
                ...current,
                match: Math.max(0, current.match - 1),
              }))
            }
          />
        </div>
      </section>
    </div>
  );
}
````

## File: ResumeKitty/components/StorySection.tsx
````typescript
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

const STORY_SCENES = [
  {
    id: 1,
    image: 'https://picsum.photos/seed/mochi-sad/800/450',
    crop: 'center',
    title: 'The Frustrated Cat',
    narration: 'Meet Mochi, a hardworking little cat trying to get a job.',
  },
  {
    id: 2,
    image: 'https://picsum.photos/seed/mochi-messy/800/450',
    crop: 'center',
    title: 'Resume Problems',
    narration: "But Mochi's resume was messy and confusing...",
  },
  {
    id: 3,
    image: 'https://picsum.photos/seed/mochi-crying/800/450',
    crop: 'center',
    title: 'Crying Cat Moment',
    narration: 'No interviews... no callbacks...',
  },
  {
    id: 4,
    image: 'https://picsum.photos/seed/mochi-discovery/800/450',
    crop: 'center',
    title: 'Discovery',
    narration: 'Until Mochi discovered ResumeKitty.',
  },
  {
    id: 5,
    image: 'https://picsum.photos/seed/mochi-magic/800/450',
    crop: 'center',
    title: 'AI Magic',
    narration: 'AI helped Mochi build a clean resume, choose beautiful templates, and tailor it to every job.',
  },
  {
    id: 6,
    image: 'https://picsum.photos/seed/mochi-success/800/450',
    crop: 'center',
    title: 'Success',
    narration: 'Suddenly... interviews started coming!',
  },
  {
    id: 7,
    image: 'https://picsum.photos/seed/mochi-happy/800/450',
    crop: 'center',
    title: 'Happy Ending',
    narration: 'Thanks to ResumeKitty, Mochi finally got the job.',
  },
];

export default function StorySection() {
  const [currentScene, setCurrentScene] = useState(0);

  return (
    <div className="mx-auto my-24 max-w-4xl px-4">
      <div className="mb-12 text-center">
        <h2 className="flex items-center justify-center gap-3 text-4xl font-display text-brand-brown">
          <Sparkles className="text-brand-accent" />
          Mochi&apos;s Journey
          <Sparkles className="text-brand-accent" />
        </h2>
        <p className="mt-2 text-gray-500">The story of how one cat changed their career forever</p>
      </div>

      <div className="cute-card relative overflow-hidden bg-white">
        <div className="relative aspect-video bg-brand-cream/30">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScene}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="relative h-full w-full"
            >
              <div className="absolute inset-0 overflow-hidden">
                <Image
                  src={STORY_SCENES[currentScene].image}
                  alt={STORY_SCENES[currentScene].title}
                  fill
                  className={`object-cover transition-all duration-500 ${
                    STORY_SCENES[currentScene].crop === 'left'
                      ? 'object-left'
                      : STORY_SCENES[currentScene].crop === 'right'
                        ? 'object-right'
                        : 'object-center'
                  }`}
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-8 pt-20">
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center text-xl italic text-white md:text-2xl font-display"
                >
                  &ldquo;{STORY_SCENES[currentScene].narration}&rdquo;
                </motion.p>
              </div>
            </motion.div>
          </AnimatePresence>

          <button
            onClick={() => setCurrentScene((prev) => (prev - 1 + STORY_SCENES.length) % STORY_SCENES.length)}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border-2 border-brand-brown bg-white/80 p-2 shadow-[2px_2px_0px_0px_rgba(74,62,62,1)] transition-all hover:bg-white"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={() => setCurrentScene((prev) => (prev + 1) % STORY_SCENES.length)}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border-2 border-brand-brown bg-white/80 p-2 shadow-[2px_2px_0px_0px_rgba(74,62,62,1)] transition-all hover:bg-white"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="flex justify-center gap-2 bg-brand-green-light/10 p-6">
          {STORY_SCENES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentScene(idx)}
              className={`h-3 rounded-full transition-all ${
                currentScene === idx ? 'w-8 bg-brand-orange' : 'w-3 bg-brand-brown/20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
````

## File: ResumeKitty/components/UploadForm.tsx
````typescript
'use client';

import { DragEvent, useState } from 'react';
import { FilePlus2, FileUp, Loader2 } from 'lucide-react';

type UploadFormProps = {
  onUploaded: (payload: { fileId: string; text: string }) => void;
  onCreateFromScratch: () => void;
};

async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Upload failed.' }));
    throw new Error(error.detail || 'Upload failed.');
  }

  return response.json();
}

export default function UploadForm({ onUploaded, onCreateFromScratch }: UploadFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file: File) {
    setIsUploading(true);
    setError('');

    try {
      const payload = await uploadFile(file);
      onUploaded({
        fileId: payload.file_id,
        text: payload.text,
      });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      void handleFile(file);
    }
  }

  return (
    <div className="cute-card bg-white p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-brand-orange">
            <FileUp size={18} />
            Resume Import
          </div>
          <h3 className="text-2xl tracking-tight text-brand-brown">Bring in an existing resume.</h3>
          <p className="max-w-2xl text-sm text-gray-600">
            Drop a PDF or DOCX and ResumeKitty will send it to the backend for text extraction.
          </p>
        </div>
        <button type="button" className="cute-button-secondary px-5 py-2 text-base" onClick={onCreateFromScratch}>
          Create from scratch
        </button>
      </div>

      <label
        className={`flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-3xl border-4 border-dashed px-6 py-8 text-center transition ${
          isUploading
            ? 'border-brand-brown/20 bg-brand-cream text-gray-400'
            : 'border-brand-brown bg-brand-cream/60 hover:bg-brand-green/10'
        }`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
      >
        <input
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleFile(file);
            }
          }}
        />

        {isUploading ? (
          <>
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-brand-green-dark" />
            <p className="text-lg font-semibold text-brand-brown">Uploading resume...</p>
            <p className="mt-2 max-w-md text-sm text-gray-500">
              Waiting for the backend to extract raw text from your document.
            </p>
          </>
        ) : (
          <>
            <div className="mb-4 rounded-2xl border-4 border-brand-brown bg-white p-4 text-brand-orange shadow-[4px_4px_0px_0px_rgba(74,62,62,1)]">
              <FilePlus2 className="h-10 w-10" />
            </div>
            <p className="text-lg font-semibold text-brand-brown">Drag a file here or browse</p>
            <p className="mt-2 max-w-md text-sm text-gray-500">Supported formats: `.pdf` and `.docx`</p>
          </>
        )}
      </label>

      {error ? (
        <p className="mt-4 rounded-2xl border-4 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
````

## File: ResumeKitty/hooks/use-mobile.ts
````typescript
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
````

## File: ResumeKitty/lib/utils.ts
````typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
````

## File: ResumeKitty/types/builder.ts
````typescript
export type BuilderMode = 'scratch' | 'upload' | 'match';

export const BUILDER_MODE_OPTIONS: Array<{
  id: BuilderMode;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    id: 'scratch',
    label: 'Create from scratch',
    shortLabel: 'Scratch',
    description: 'Start with a blank resume and fill the editor directly.',
  },
  {
    id: 'upload',
    label: 'Upload and parse',
    shortLabel: 'Upload',
    description: 'Import a PDF or DOCX, review the extracted text, and parse it.',
  },
  {
    id: 'match',
    label: 'Match a job description',
    shortLabel: 'Match',
    description: 'Tailor your resume against a pasted job description in the same workspace.',
  },
];
````

## File: ResumeKitty/types/match.ts
````typescript
import type { ResumeSectionKey } from '@/types/resume';

export type MatchSuggestion = {
  section: ResumeSectionKey;
  title: string;
  detail: string;
};

export type MatchResult = {
  score: number;
  analyzedKeywords: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: MatchSuggestion[];
};
````

## File: ResumeKitty/types/resume.ts
````typescript
export type SkillCategory = {
  category: string;
  items: string[];
};

export type ExperienceItem = {
  id?: string | null;
  role?: string | null;
  company?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  current?: boolean;
  description?: string | null;
  bullets: string[];
};

export type EducationItem = {
  degree?: string | null;
  field?: string | null;
  institution?: string | null;
  location?: string | null;
  start_year?: string | null;
  end_year?: string | null;
  gpa?: string | null;
};

export type ProjectItem = {
  title?: string | null;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  technologies: string[];
  bullets: string[];
  link?: string | null;
};

export type CompactItem = {
  description?: string | null;
  date?: string | null;
  link?: string | null;
};

export type RenderOptions = {
  template: string;
  font_size: number;
  max_bullets_per_job: number;
  margin: string;
  page_limit: number;
  section_order: ResumeSectionKey[];
};

export type ResumeSectionKey =
  | 'summary'
  | 'skills'
  | 'experience'
  | 'education'
  | 'projects'
  | 'certifications'
  | 'awards'
  | 'leadership'
  | 'extracurricular';

export type Resume = {
  meta: {
    version: string;
    created_at: string;
    updated_at: string;
    source: string;
    template: string;
    page_limit: number;
  };
  header: {
    name?: string | null;
    title?: string | null;
    email?: string | null;
    phone?: string | null;
    location?: string | null;
    linkedin?: string | null;
    github?: string | null;
    website?: string | null;
    portfolio?: string | null;
  };
  summary?: string | null;
  skills: string[] | SkillCategory[];
  experience: ExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  certifications: CompactItem[];
  awards: CompactItem[];
  leadership: CompactItem[];
  extracurricular: CompactItem[];
};

export const createEmptyResume = (): Resume => ({
  meta: {
    version: '1.0',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    source: 'form',
    template: 'modern',
    page_limit: 1,
  },
  header: {
    name: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    website: '',
    portfolio: '',
  },
  summary: '',
  skills: [],
  experience: [],
  education: [],
  projects: [],
  certifications: [],
  awards: [],
  leadership: [],
  extracurricular: [],
});

export const defaultRenderOptions: RenderOptions = {
  template: 'modern',
  font_size: 11,
  max_bullets_per_job: 4,
  margin: '1cm',
  page_limit: 1,
  section_order: [
    'summary',
    'skills',
    'education',
    'experience',
    'projects',
    'certifications',
    'awards',
    'leadership',
    'extracurricular',
  ],
};

export const TEMPLATE_OPTIONS: Array<{ id: string; label: string }> = [
  { id: 'modern', label: 'Modern' },
  { id: 'jakes_resume', label: 'Jake Classic' },
  { id: 'swe_template', label: 'SWE Minimal' },
  { id: 'entry_level_resume', label: 'Entry Level Blue' },
  { id: 'plush_cv', label: 'Plush Two Column' },
];

export const SECTION_MANAGER_OPTIONS: Array<{ id: ResumeSectionKey; label: string }> = [
  { id: 'summary', label: 'Profile Summary' },
  { id: 'skills', label: 'Skills' },
  { id: 'education', label: 'Education' },
  { id: 'experience', label: 'Experience / Internships' },
  { id: 'projects', label: 'Projects' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'awards', label: 'Achievements / Awards' },
  { id: 'leadership', label: 'Leadership / Responsibilities' },
  { id: 'extracurricular', label: 'Extracurricular Activities' },
];
````

## File: ResumeKitty/.env.example
````
# Base URL for the FastAPI backend.
NEXT_PUBLIC_API_BASE="http://localhost:8000"
````

## File: ResumeKitty/.eslintrc.json
````json
{
  "extends": "next"
}
````

## File: ResumeKitty/.gitignore
````
node_modules/
.next/
coverage/
.DS_Store
*.log
.env*
!.env.example
````

## File: ResumeKitty/Dockerfile
````
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]
````

## File: ResumeKitty/eslint.config.mjs
````javascript
import { defineConfig } from "eslint/config";
import next from "eslint-config-next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig([{
    extends: [...next],
}]);
````

## File: ResumeKitty/metadata.json
````json
{
  "name": "ResumePro",
  "description": "Professional resume parsing and LaTeX generation for modern job seekers.",
  "requestFramePermissions": []
}
````

## File: ResumeKitty/next-env.d.ts
````typescript
/// <reference types="next" />
/// <reference types="next/image-types/global" />
/// <reference path="./.next/types/routes.d.ts" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
````

## File: ResumeKitty/next.config.ts
````typescript
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  async rewrites() {
    const backendBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

    return [
      {
        source: '/api/:path*',
        destination: `${backendBase}/:path*`,
      },
    ];
  },
  output: 'standalone',
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
````

## File: ResumeKitty/package.json
````json
{
  "name": "ai-studio-applet",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "clean": "node -e \"require('fs').rmSync('.next', { recursive: true, force: true })\""
  },
  "dependencies": {
    "@hookform/resolvers": "^5.2.1",
    "autoprefixer": "^10.4.21",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.553.0",
    "motion": "^12.23.24",
    "next": "^15.4.9",
    "postcss": "^8.5.6",
    "react": "^19.2.1",
    "react-dom": "^19.2.1",
    "react-markdown": "^10.1.0",
    "tailwind-merge": "^3.3.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "4.1.11",
    "@tailwindcss/typography": "^0.5.19",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "9.39.1",
    "eslint-config-next": "16.0.8",
    "firebase-tools": "^15.0.0",
    "tailwindcss": "4.1.11",
    "tw-animate-css": "^1.4.0",
    "typescript": "5.9.3"
  }
}
````

## File: ResumeKitty/postcss.config.mjs
````javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};

export default config;
````

## File: ResumeKitty/PRODUCT_ARCHITECTURE.md
````markdown
# ResumeKitty Product Architecture

## Product Architecture

### Core pages

1. `Landing`
   - Explains value quickly.
   - Sends users into one builder with three entry modes: scratch, upload, or JD match.
   - Keeps marketing lightweight instead of duplicating the editor on the homepage.

2. `Resume Builder`
   - The single workspace for parsing, editing, template switching, previewing, JD matching, and download intent.
   - Reused for both logged-out and logged-in users so the product has one editing pattern.

3. `Dashboard`
   - Visible after a user has unlocked downloads or returns later.
   - Lists saved resumes, recent activity, and quick actions back into the builder.

4. `Help`
   - Handles FAQs, support, and resume-writing guidance.
   - Kept separate because it is informational, not part of the builder workflow.

5. `Auth Gate`
   - Not a standalone navigation destination.
   - Opens only when a user tries to download or save permanently.

### Why this works

- It removes unnecessary step pages.
- It keeps all resume work inside one mental model.
- It shows value before signup.
- It lets template changes, match analysis, and preview happen without route hopping.

## User Flows

### Create from scratch

`Landing` -> `Builder (scratch mode)` -> Fill sections -> Switch template if needed -> Render preview -> `Download gate` -> Download -> `Dashboard`

### Upload and parse

`Landing` -> `Builder (upload mode)` -> Upload PDF or DOCX -> Review extracted text -> Parse to structured resume -> Edit -> Render preview -> `Download gate` -> Download -> `Dashboard`

### Upload JD and match

`Landing` -> `Builder (match mode)` -> Upload or start from existing resume -> Paste JD -> Run analysis -> Review score and suggestions -> Edit in same workspace -> Render preview -> `Download gate` -> Download

### Edit existing resume after login

`Dashboard` -> Open resume -> `Builder` -> Edit content or template -> Re-render preview -> Download again

## Editor Design

### Unified editing pattern

- Use one page-based workspace, not separate wizard pages.
- Organize the builder as a three-column behavior on desktop:
  - Left: entry actions and source text
  - Center: resume editor
  - Right: sticky preview and match assistant
- Collapse to stacked sections on mobile.

### Section navigation

- Keep section management inside the builder, not as a separate route.
- Use section chips and a section manager modal for visibility and order.
- Add entries such as experience or projects inline within their section cards.

### AI assistance

- Show AI actions contextually near the content they improve.
- Keep JD match suggestions in the same workspace so users can immediately edit against them.
- Treat credits as a lightweight status strip, not a separate billing page during the initial experience.

### Preview behavior

- Keep preview visible during editing on desktop.
- Offer a larger focused preview state inside the builder, not on a different route.
- Require signup only when the user tries to export.

## Template UX

- Template switching belongs inside the builder.
- The best pattern is inline switching with quick-select chips plus deeper controls in the editor panel.
- A separate template page adds friction and breaks comparison.

## Preview UX

- Preview should be live in the sense that it is always nearby, but rendering can still be user-triggered.
- The builder should support a sticky preview card for normal work and a larger preview state for detailed inspection.
- Download belongs beside preview because that is where user confidence peaks.

## Match Analysis UX

- JD upload or paste lives in the builder as a side panel.
- Analysis returns:
  - match score
  - matched keywords
  - missing keywords
  - suggested sections to update
- Users never leave the builder to apply improvements.

## Page vs Modal Decisions

- Resume upload: panel inside builder
- Create from scratch: builder mode
- Template switch: inline chips plus editor controls
- Section manager: modal
- Download/signup: modal
- JD match: side panel inside builder
- Full preview: expanded state inside builder

## Navigation

### Logged-out

- `Home`
- `Builder`
- `Help`
- Strong CTA into the builder

### Logged-in

- `Home`
- `Builder`
- `Dashboard`
- `Help`
- Saved resume actions become available, but the core builder stays the same

## Final Product Map

`Landing`
- Product value, mode entry points, lightweight feature proof

`Resume Builder`
- Upload, parsing, editing, template control, preview, JD match, download gate

`Dashboard`
- Saved resumes, recent activity, re-entry into builder

`Help`
- Documentation, support, guidance

`Auth Gate`
- Triggered from download/save actions only
````

## File: ResumeKitty/README.md
````markdown
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ResumeKitty

This app now contains the full resume workflow: upload, parse, edit JSON, render LaTeX templates, and preview the final PDF.

## Run Locally

**Prerequisites:** Node.js and the backend service from the repository root.


1. Install dependencies:
   `npm install`
2. Set `NEXT_PUBLIC_API_BASE` if your backend is not running at `http://localhost:8000`
3. Run the app:
   `npm run dev`
````

## File: ResumeKitty/tsconfig.json
````json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
````

## File: .gitignore
````
__pycache__/
*.pyc
.pytest_cache/
.mypy_cache/
.next/
node_modules/
venv/
dist/
build/
coverage/
*.log
*.pdf
*.aux
*.out
*.toc
.DS_Store
.env*

sample/
````

## File: docker-compose.yml
````yaml
services:
  backend:
    build:
      context: ./backend
    container_name: resume-backend
    env_file:
      - ./.env.local
    environment:
      AI_PROVIDER: ${AI_PROVIDER:-groq}
      GROQ_MODEL: ${GROQ_MODEL:-llama-3.3-70b-versatile}
      OPENAI_MODEL: ${OPENAI_MODEL:-gpt-4.1-mini}
      COMPILER_IMAGE: ${COMPILER_IMAGE:-resume-compiler:local}
      ALLOWED_UPLOAD_TYPES: ${ALLOWED_UPLOAD_TYPES:-.pdf,.docx}
      MAX_UPLOAD_SIZE_MB: ${MAX_UPLOAD_SIZE_MB:-5}
      FRONTEND_ORIGIN: ${FRONTEND_ORIGIN:-http://localhost:3000}
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
      - /var/run/docker.sock:/var/run/docker.sock
      - ./.env.local:/workspace/.env.local:ro
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  resumekitty:
    build:
      context: ./ResumeKitty
    container_name: resume-resumekitty
    env_file:
      - ./.env.local
    environment:
      NEXT_PUBLIC_API_BASE: ${NEXT_PUBLIC_API_BASE:-http://backend:8000}
    ports:
      - "3000:3000"
    volumes:
      - ./ResumeKitty:/app
    depends_on:
      - backend
    command: npm run dev -- --hostname 0.0.0.0 --port 3000

# docker build -t resume-compiler:local ./compiler

  compiler:
    build:
      context: ./compiler
    image: ${COMPILER_IMAGE:-resume-compiler:local}
    container_name: resume-compiler-image
    command: ["/bin/sh", "-c", "echo compiler image ready && tail -f /dev/null"]
    profiles:
      - tools
````

## File: README.md
````markdown
# ResumeKitty

Upload a resume, parse it into structured JSON with Groq or OpenAI, edit the JSON in a simple web UI, render it through a LaTeX template, and compile a PDF inside an isolated Docker container.

## Stack

- Backend: FastAPI + Pydantic + Jinja2
- Frontend: Next.js + React + TypeScript
- AI: Groq by default, OpenAI as fallback
- PDF compilation: Dockerized TeX Live sandbox

## Flow

1. Upload a PDF or DOCX.
2. Extract raw text on the backend.
3. Parse the text into the canonical resume schema with the configured LLM.
4. Edit the structured result in the browser.
5. Render the selected LaTeX template.
6. Compile to PDF inside the `resume-compiler` container.
7. Preview or download the final PDF.

## Environment

Create `.env.local` in the repository root. The provided file already contains `GROQ_API_KEY`.

Required or supported variables:

- `AI_PROVIDER`: `groq` or `openai` (`groq` is the default)
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `COMPILER_IMAGE`
- `ALLOWED_UPLOAD_TYPES`
- `MAX_UPLOAD_SIZE_MB`
- `FRONTEND_ORIGIN`
- `NEXT_PUBLIC_API_BASE`

## Local Run

### 1. Build the compiler image

```bash
docker build -t resume-compiler:local ./compiler
```

### 2. Start the backend

```bash
cd backend
pip install -r app/requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Start ResumeKitty

```bash
cd ResumeKitty
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Docker Compose

```bash
docker compose up --build
```

This builds ResumeKitty, the backend, and the compiler image. The backend shells out to Docker for LaTeX compilation, so the compiler image still needs to be available to the daemon used by the backend.

## Backend Endpoints

- `GET /health`
- `POST /upload`
- `POST /parse`
- `POST /render`

## Tests

```bash
cd backend
pip install -r app/requirements.txt
pytest tests -v
```

## Notes

- LaTeX compilation uses `-no-shell-escape`.
- The compiler container runs as a non-root user.
- Rendered content is LaTeX-escaped before template injection.
- Uploads are restricted to configured file types and file size limits.
````
