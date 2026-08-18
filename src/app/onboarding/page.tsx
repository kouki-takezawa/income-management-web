import { requireUserId } from "@/lib/session";
import { getOrCreateSettings } from "@/lib/data";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default async function OnboardingPage() {
  const userId = await requireUserId();
  const settings = await getOrCreateSettings(userId);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-lg">
        <OnboardingWizard settings={settings} />
      </div>
    </div>
  );
}
