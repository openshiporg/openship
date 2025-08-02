import { cn } from "@/lib/utils";
import { Space_Grotesk } from "next/font/google";
import { LogoIcon } from "./LogoIcon";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: false,
});

interface LogoProps {
  className?: string;
  textClassName?: string;
  iconClassName?: string;
}

export const Logo = ({
  className,
  textClassName,
  iconClassName,
}: LogoProps) => {
  return (
    <div className={cn(spaceGrotesk.className, className)}>
      <div className="flex items-center gap-2 text-zinc-700 dark:text-white">
        <LogoIcon className={cn("size-5", iconClassName)} suffix="-full" />
          <h1 className={cn(textClassName, "mb-1 text-xl font-semibold tracking-tight")} >
          open<span className="font-normal">ship</span>
        </h1>
      </div>
    </div>
  );
};

export { LogoIcon };
