import { Panel } from "../ui/Panel";

interface ResumePreviewProps {
  compileError: string | null;
  pdfUrl: string | null;
  previewStale: boolean;
}
export function ResumePreview({ compileError, pdfUrl, previewStale }: ResumePreviewProps) {
  return (
    <Panel className="flex h-full min-h-0 flex-col p-6">
      <div className="flex-1 min-h-0 overflow-hidden rounded-[1.75rem] bg-[#2d2d2d]">
        {pdfUrl ? (
          <iframe title="Compiled resume PDF" src={pdfUrl} className="h-full w-full bg-white" />
        ) : (
          <div className="flex h-full min-h-0 items-center justify-center px-8 text-center">
            {compileError ? (
              <p className="text-sm leading-6 text-white/80">{compileError}</p>
            ) : previewStale ? (
              <p className="text-sm leading-6 text-white/60">Re-render to refresh the preview.</p>
            ) : null}
          </div>
        )}
      </div>
    </Panel>
  );
}
