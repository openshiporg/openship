import Link from "next/link";
import { LogoIconSVG } from "@svg";
import { cn } from "./utils/cn";
import { Circle, CircleDot, Square, Triangle } from "lucide-react";
import { DM_Sans, Montserrat, Nunito_Sans, Outfit } from "next/font/google";
const montserrat = Outfit({ subsets: ["latin"] });

// export const Logo = () => {
//   return (
//     <h3>
//       <Link href="/">
//         <div className="flex items-center">
//           <LogoIconSVG className="w-4 h-4 stroke-slate-500 mr-2" />

//           <h1 className={`mb-1 text-2xl md:text-3xl font-semibold text-center`}>
//             open
//             <span className="font-normal">ship</span>{" "}
//           </h1>
//         </div>
//       </Link>
//     </h3>
//   );
// };

export const Logo = ({ size = "md", className }) => {
  const sizeClasses = {
    sm: "text-xs md:text-md",
    md: "text-md md:text-2xl",
    lg: "text-2xl md:text-3xl",
  };

  return (
    <h3 className={cn(`${montserrat.className} ${className}`)}>
      <div
        className={cn(
          "flex items-center gap-2.5 text-slate-700 dark:text-white",
          sizeClasses[size]
        )}
      >
        <Circle className="mt-[2px] w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-[1.3rem] md:h-[1.3rem] fill-emerald-200 stroke-emerald-400 dark:stroke-emerald-600 dark:fill-emerald-950" />
        <h1 className={cn("tracking-[0.02em] mb-1.5 font-medium text-center")}>
          open<span className="font-light">ship</span>
        </h1>
      </div>
    </h3>
  );
};
