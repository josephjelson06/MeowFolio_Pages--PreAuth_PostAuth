import { JdReportPanel } from "../../components/analysis/JdReportPanel";
import { JdSidebar } from "../../components/analysis/JdSidebar";
import { AppLayout } from "../../components/layout/AppLayout";
import { WorkspaceSplitLayout } from "../../components/layout/WorkspaceSplitLayout";

export function JdPage() {
  return (
    <AppLayout contentClassName="overflow-hidden px-6 py-6">
      <WorkspaceSplitLayout left={<JdSidebar />} right={<JdReportPanel />} variant="analysis" />
    </AppLayout>
  );
}
