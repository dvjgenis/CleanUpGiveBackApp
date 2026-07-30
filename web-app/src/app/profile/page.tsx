import { SidebarDemo } from "@/components/ui/sidebar-demo";
import { ProfilePage } from "@/components/pages/ProfilePage";

export default function Profile() {
  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <ProfilePage />
      </SidebarDemo>
    </div>
  );
}
