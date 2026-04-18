import { AppShell } from "@/components/app-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { QuickActionsGrid } from "@/components/dashboard/quick-actions-grid";
import { QuickTips } from "@/components/dashboard/quick-tips";
import { RecentSearches } from "@/components/dashboard/recent-searches";
import { SearchBar } from "@/components/dashboard/search-bar";
import { StatusDisplay } from "@/components/dashboard/status-display";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <DashboardHeader />
        <SearchBar />
        <QuickActionsGrid />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="space-y-6">
            <RecentSearches />
            <QuickTips />
          </div>
          <StatusDisplay />
        </div>
      </div>
    </AppShell>
  );
}
