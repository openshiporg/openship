import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { basePath } from "@keystone/index";

export const useRedirect = () => {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  const redirect = useMemo(() => {
    if (typeof from !== "string" || !from.startsWith("/")) {
      return basePath;
    }

    // Remove the basePath prefix if it exists
    const cleanFrom = from.startsWith(basePath) 
      ? from.slice(basePath.length) 
      : from;

    // Check if the cleaned path is just "/signin" or contains "signin?from="
    if (cleanFrom === "/signin" || cleanFrom.includes("signin?from=")) {
      return basePath;
    }

    return cleanFrom;
  }, [from]);

  return redirect;
};
