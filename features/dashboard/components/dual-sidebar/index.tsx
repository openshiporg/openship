import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Header } from "./header";
import { RightSidebar } from "./right-sidebar";

const Sidebar = () => {
  return (
    <SidebarProvider>
      <AppSidebar side="left" />
      <SidebarInset className="h-full overflow-hidden">
        <Header />
        <div className="p-4">Hello</div>
      </SidebarInset>
      <RightSidebar side="right" />
    </SidebarProvider>
  );
};

export default Sidebar;
