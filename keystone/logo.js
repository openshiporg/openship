import { cn } from "./utils/cn";
import { Circle } from "lucide-react";
import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: false,
});

export const LogoIcon = ({ className }) => {
  return (
    <div className="basis-[1.2rem] flex items-center justify-center">
      <Circle
        className={cn(
          "fill-emerald-200 stroke-emerald-400 dark:stroke-emerald-600 dark:fill-emerald-950 w-full h-full",
          className
        )}
      />
    </div>
  );
};

export const Logo = ({ className }) => {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-zinc-700 dark:text-white",
        outfit.className,
        className
      )}
    >
      <LogoIcon />
      <h1 className="tracking-[0.02em] mb-1.5 font-medium text-2xl text-center">
        open<span className="font-light">ship</span>
      </h1>
    </div>
  );
};
