import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { requestImportedResumeFile, requestImportedResumeText } from "../../lib/import-client";
import { PublicLayout } from "../../components/layout/PublicLayout";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Chip } from "../../components/ui/Chip";
import { SectionHeading } from "../../components/ui/SectionHeading";
import { createEmptyResumeData } from "../../types/resume";
import { useWorkspace } from "../workspace/WorkspaceContext";

type StartMode = "scratch" | "upload";
type UploadState = "error" | "idle" | "loading";

export function ChoosePathPage() {
  const { setResume } = useWorkspace();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<StartMode | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isDropActive, setIsDropActive] = useState(false);
  const [pastedText, setPastedText] = useState("");

  function startFromScratch() {
    setResume(createEmptyResumeData("scratch"));
    navigate("/editor?tab=content");
  }

  function handleImportError(error: unknown) {
    setUploadState("error");
    setUploadMessage(error instanceof Error ? error.message : "Import failed. Try again with a cleaner file or text.");
  }

  async function completeImportFromText(text: string) {
    const trimmed = text.trim();

    if (!trimmed) {
      setUploadState("error");
      setUploadMessage("Paste resume text first, then continue.");
      return;
    }

    setUploadState("loading");
    setUploadMessage("Parsing resume text...");

    try {
      const response = await requestImportedResumeText(trimmed);
      setResume(response.result.resume);
      navigate("/editor?tab=content");
    } catch (error) {
      handleImportError(error);
    }
  }

  async function completeImportFromFile(file: File) {
    setUploadState("loading");
    setUploadMessage(`Importing ${file.name}...`);

    try {
      const response = await requestImportedResumeFile(file);
      setResume(response.result.resume);
      navigate("/editor?tab=content");
    } catch (error) {
      handleImportError(error);
    }
  }

  async function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    await completeImportFromFile(file);
    event.target.value = "";
  }

  async function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDropActive(false);

    const file = event.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    await completeImportFromFile(file);
  }

  return (
    <PublicLayout>
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <Chip tone="lavender">Create New Resume</Chip>
          <h1 className="mt-6 font-headline text-5xl font-extrabold tracking-[-0.03em] text-on-surface md:text-6xl">
            Choose how you want to start.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-on-surface-variant">
            Upload an existing draft and continue with pre-filled editor fields, or start fresh with a blank resume.
          </p>
        </div>
      </section>

      <section className="px-6 pb-10">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <Card className="rounded-[2rem] p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-low card-border">
              <span className="material-symbols-outlined text-3xl text-primary">upload_file</span>
            </div>
            <h2 className="mt-6 font-headline text-3xl font-extrabold text-on-surface">Upload Resume</h2>
            <p className="mt-4 text-base leading-7 text-on-surface-variant">
              Drag and drop a PDF/DOCX/TXT/MD file, or paste resume text. We parse it and open the editor with fields already filled.
            </p>
            <div className="mt-6">
              <Button
                onClick={() => {
                  setSelectedMode("upload");
                  setUploadState("idle");
                  setUploadMessage(null);
                }}
                size="lg"
                icon="upload"
              >
                Upload and Continue
              </Button>
            </div>
          </Card>

          <Card className="rounded-[2rem] p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-low card-border">
              <span className="material-symbols-outlined text-3xl text-primary">edit_square</span>
            </div>
            <h2 className="mt-6 font-headline text-3xl font-extrabold text-on-surface">Create from Scratch</h2>
            <p className="mt-4 text-base leading-7 text-on-surface-variant">
              Start directly in the editor with blank fields and build your resume section by section.
            </p>
            <div className="mt-6">
              <Button onClick={startFromScratch} size="lg" icon="arrow_forward">
                Start Blank Resume
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {selectedMode === "upload" ? (
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-6xl">
            <Card className="rounded-[2rem] p-8">
              <SectionHeading
                eyebrow="Upload or Paste"
                title="Bring your existing resume"
                description="Use either drag-and-drop upload or pasted text. Once parsed, we’ll take you straight to the editor with populated fields."
              />

              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDropActive(true);
                  }}
                  onDragLeave={() => setIsDropActive(false)}
                  onDrop={handleDrop}
                  className={`flex min-h-[260px] w-full flex-col items-center justify-center rounded-[1.75rem] border-2 border-dashed px-6 py-8 text-center transition ${
                    isDropActive
                      ? "border-primary bg-primary-fixed/50"
                      : "border-outline-variant/30 bg-surface-container-lowest hover:border-primary/50"
                  }`}
                >
                  <span className="material-symbols-outlined text-5xl text-primary">upload_file</span>
                  <p className="mt-4 font-headline text-xl font-bold text-on-surface">Drag and drop your resume</p>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">PDF, DOCX, TXT, MD (max 5MB)</p>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={handleFileSelection}
                />

                <div className="rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest p-6">
                  <p className="font-label text-xs font-bold uppercase tracking-[0.18em] text-primary">Paste Text</p>
                  <textarea
                    className="mt-4 min-h-[180px] w-full resize-y rounded-[1.25rem] border border-outline-variant/20 bg-surface-container-highest px-4 py-3 text-sm leading-6 text-on-surface outline-none transition focus:border-primary/40 focus:bg-white"
                    value={pastedText}
                    onChange={(event) => setPastedText(event.target.value)}
                    placeholder="Paste your full resume text here..."
                  />
                  <div className="mt-5">
                    <Button
                      onClick={() => {
                        void completeImportFromText(pastedText);
                      }}
                      icon="auto_awesome"
                      disabled={uploadState === "loading"}
                    >
                      {uploadState === "loading" ? "Parsing..." : "Parse Text and Continue"}
                    </Button>
                  </div>
                </div>
              </div>

              {uploadMessage ? (
                <div
                  className={`mt-6 rounded-[1.25rem] border px-4 py-3 text-sm ${
                    uploadState === "error"
                      ? "border-error-container bg-error-container/40 text-on-surface"
                      : "border-outline-variant/20 bg-surface-container-highest text-on-surface"
                  }`}
                >
                  {uploadMessage}
                </div>
              ) : null}
            </Card>
          </div>
        </section>
      ) : null}
    </PublicLayout>
  );
}
