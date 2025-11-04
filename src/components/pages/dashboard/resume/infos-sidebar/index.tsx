import Link from "next/link";
import Logo from "@/assets/logo.svg";
import { AIGenerationDropdown } from "./ai-generation-dropdown";
import { Separator } from "@/components/ui/separator";
import { BasicInfoSection } from "./sections/basic-info";
import { SummarySection } from "./sections/summary";
import { MultiplesSections } from "./sections/multiples";

/**
 * Renders the sidebar for resume information in the dashboard.
 *
 * This component displays the logo, AI generation dropdown, and various resume sections
 * including basic info, summary, and multiple sections.
 *
 * @returns {JSX.Element} A sidebar component with resume editing sections
 */
export const InfosSidebar = () => {
  return (
    <aside className="w-full h-full p-3 overflow-y-auto">
      <div className="w-full flex items-center justify-between">
        <Link href="/dashboard/resumes">
          <Logo className="w-full min-w-[120px] max-w-[183px] text-sm" />
        </Link>

        <AIGenerationDropdown />
      </div>

      <Separator className="my-5" />

      <BasicInfoSection />
      <Separator className="my-5" />
      <SummarySection />
      <MultiplesSections />
    </aside>
  );
};
