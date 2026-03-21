import { AtsReportPanel } from "../../components/analysis/AtsReportPanel";
import { AtsSidebar } from "../../components/analysis/AtsSidebar";
import { AppLayout } from "../../components/layout/AppLayout";
import { WorkspaceSplitLayout } from "../../components/layout/WorkspaceSplitLayout";

export function AtsPage() {
  return (
    <AppLayout contentClassName="overflow-hidden px-6 py-6">
      <WorkspaceSplitLayout left={<AtsSidebar />} right={<AtsReportPanel />} variant="sidebar" />
    </AppLayout>
  );
}
