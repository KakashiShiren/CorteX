import { AppShell } from "@/components/app-shell";
import { AccountSection } from "@/components/settings/account-section";
import { AppearanceSection } from "@/components/settings/appearance-section";
import { DataSection } from "@/components/settings/data-section";
import { HelpSection } from "@/components/settings/help-section";
import { NotificationsSection } from "@/components/settings/notifications-section";
import { PrivacySection } from "@/components/settings/privacy-section";
import { ProfileSection } from "@/components/settings/profile-section";
import { SettingsTabs } from "@/components/settings/settings-tabs";

export function SettingsShell({
  activeTab
}: {
  activeTab:
    | "/settings/profile"
    | "/settings/account"
    | "/settings/privacy"
    | "/settings/notifications"
    | "/settings/appearance"
    | "/settings/data"
    | "/settings/help";
}) {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <div className="eyebrow">Settings</div>
          <h1 className="mt-3 text-4xl">Personalize Cortex</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-black/60 dark:text-white/60">
            Manage profile visibility, account security, notifications, theme, and data controls from one place.
          </p>
        </div>
        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <div className="xl:sticky xl:top-24 xl:self-start">
            <SettingsTabs activeHref={activeTab} />
          </div>
          {activeTab === "/settings/profile" ? <ProfileSection /> : null}
          {activeTab === "/settings/account" ? <AccountSection /> : null}
          {activeTab === "/settings/privacy" ? <PrivacySection /> : null}
          {activeTab === "/settings/notifications" ? <NotificationsSection /> : null}
          {activeTab === "/settings/appearance" ? <AppearanceSection /> : null}
          {activeTab === "/settings/data" ? <DataSection /> : null}
          {activeTab === "/settings/help" ? <HelpSection /> : null}
        </div>
      </div>
    </AppShell>
  );
}
