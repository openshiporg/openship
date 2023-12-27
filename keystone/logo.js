import Link from "next/link";
import { LogoIconSVG } from "@svg";

export const Logo = () => {
  return (
    <h3>
      <Link href="/">
        <div className="flex items-center">
          <LogoIconSVG className="w-4 h-4 stroke-slate-500 mr-2" />

          <h1 className={`mb-1 text-2xl md:text-3xl font-semibold text-center`}>
            open
            <span className="font-normal">ship</span>{" "}
          </h1>
        </div>
      </Link>
    </h3>
  );
};
