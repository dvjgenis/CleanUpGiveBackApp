import { SidebarDemo } from "@/components/ui/sidebar-demo";
import { EmailsPage } from "@/components/pages/EmailsPage";
import { listAllTemplates } from "@/lib/email-templates";
import { listScheduledEmails } from "@/lib/scheduled-emails";
import { getVolunteerDirectory } from "@/lib/volunteers";
import { getFromAddress } from "@/lib/resend";

export const dynamic = "force-dynamic";

interface SearchParams {
  tab?: string;
}

function resolveInitialTab(tab: string | undefined): "compose" | "scheduled" | "templates" {
  if (tab === "templates") return "templates";
  if (tab === "scheduled") return "scheduled";
  return "compose";
}

export default async function Emails({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { tab } = await searchParams;
  const [templates, directory, scheduledEmails] = await Promise.all([
    listAllTemplates(),
    getVolunteerDirectory(),
    listScheduledEmails(),
  ]);
  const volunteers = Array.from(directory.entries())
    .filter(([, entry]) => Boolean(entry.email))
    .map(([id, entry]) => ({ id, name: entry.name, email: entry.email as string }));

  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <EmailsPage
          templates={templates}
          volunteers={volunteers}
          scheduledEmails={scheduledEmails}
          fromAddress={getFromAddress()}
          initialTab={resolveInitialTab(tab)}
        />
      </SidebarDemo>
    </div>
  );
}
