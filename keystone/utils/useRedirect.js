import { useMemo } from "react";
import { useSearchParams } from "next/navigation";


export const useRedirect = () => {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  const redirect = useMemo(() => {
    if (typeof from !== "string")
      return "/dashboard";
    if (!from.startsWith("/"))
      return "/dashboard";
    if (from === "/no-access")
      return "/dashboard";

    return from;
  }, [from]);

  return redirect;
};
