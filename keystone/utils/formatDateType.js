import { formatISO } from "date-fns";

export const formatDateType = (date) => {
  return formatISO(date, { representation: "date" });
};
