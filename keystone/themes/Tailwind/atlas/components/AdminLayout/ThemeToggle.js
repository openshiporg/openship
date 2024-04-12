import React, { useEffect } from "react";
import {
  User,
  Sun,
  Moon,
  Monitor,
  LogOutIcon,
  Settings,
  Briefcase,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@keystone/primitives/default/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@keystone/primitives/default/ui/dropdown-menu";
import { gql, useMutation } from "@keystone-6/core/admin-ui/apollo";
import { Badge } from "@keystone/primitives/default/ui/badge";

const END_SESSION = gql`
  mutation EndSession {
    endSession
  }
`;

const ToggleButton = ({ isActive, onClick, children }) => (
  <button
    onClick={onClick}
    className={`py-1 px-2.5 inline-flex items-center justify-center whitespace-nowrap rounded-sm text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
      isActive
        ? "bg-background text-foreground shadow"
        : "text-zinc-600 dark:text-zinc-200"
    }`}
  >
    {children}
  </button>
);

export default function ThemeToggle({ authenticatedItem }) {
  const { setTheme, theme } = useTheme();
  const [endSession, { loading, data }] = useMutation(END_SESSION);

  useEffect(() => {
    if (data?.endSession) {
      window.location.reload();
    }
  }, [data]);

  const handleLogout = async () => {
    try {
      await endSession();
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
   
          <button className="focus:ring-2 focus:ring-offset-background border-2 h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 via-indigo-500 to-rose-400 dark:from-indigo-800 dark:via-fuchsia-900 dark:to-green-700" >

          <span className="sr-only">Toggle user menu</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          {/* <span className="text-xs font-normal">Signed in as</span>
          <br /> */}
          <span className="text-base">Hi {authenticatedItem.label}</span>
          <br />
          <span className="text-xs font-normal text-blue-700 dark:text-blue-200">
            Signed in
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem>
          Settings <Settings className="ml-auto h-4 w-4" />
        </DropdownMenuItem>
        <DropdownMenuItem>
          Support <Briefcase className="ml-auto h-4 w-4" />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          {loading ? "Logging out..." : "Logout"}
          <LogOutIcon className="ml-auto h-4 w-4" />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Theme Toggle Section */}
        <div className="gap-1 w-full inline-flex justify-center rounded-sm bg-muted p-1 text-muted-foreground">
          <ToggleButton
            isActive={theme === "system"}
            onClick={() => setTheme("system")}
          >
            <Monitor className="h-4 w-4" />
          </ToggleButton>
          <ToggleButton
            isActive={theme === "light"}
            onClick={() => setTheme("light")}
          >
            <Sun className="h-4 w-4" />
          </ToggleButton>
          <ToggleButton
            isActive={theme === "dark"}
            onClick={() => setTheme("dark")}
          >
            <Moon className="h-4 w-4" />
          </ToggleButton>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
