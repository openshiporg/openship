import { parse } from "date-fns";

export const deserializeDate = (date) => {
  return parse(date, "yyyy-MM-dd", new Date());
};
