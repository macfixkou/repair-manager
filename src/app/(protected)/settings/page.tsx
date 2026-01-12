import StallSettingsForm from "@/components/stall-settings-form";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">滞留閾値の設定</h1>
      <StallSettingsForm />
    </div>
  );
}
