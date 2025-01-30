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
    <Circle
      className={cn(
        "fill-emerald-200 stroke-emerald-400 dark:stroke-emerald-600 dark:fill-emerald-950",
        className
      )}
    />
  );
};

export const Logo = ({ className }) => {
  return (
    <div className={cn(outfit.className, className)}>
      <LogoIcon />
      <h1 className="tracking-[0.02em] mb-1 font-medium text-xl text-zinc-700 dark:text-white">
        open<span className="font-light">ship</span>
      </h1>
    </div>
  );
};
