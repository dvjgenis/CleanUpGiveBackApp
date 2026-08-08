import { SidebarDemo } from "@/components/ui/sidebar-demo";
import { EmailsPage } from "@/components/pages/EmailsPage";
import { listAllTemplates } from "@/lib/email-templates";
import { getVolunteerDirectory } from "@/lib/volunteers";

export const dynamic = "force-dynamic";

interface SearchParams {
  tab?: string;
}

export default async function Emails({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { tab } = await searchParams;
  const [templates, directory] = await Promise.all([listAllTemplates(), getVolunteerDirectory()]);
  const volunteers = Array.from(directory.entries())
    .filter(([, entry]) => Boolean(entry.email))
    .map(([id, entry]) => ({ id, name: entry.name, email: entry.email as string }));

  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <EmailsPage templates={templates} volunteers={volunteers} initialTab={tab === "templates" ? "templates" : "compose"} />
      </SidebarDemo>
    </div>
  );
}
