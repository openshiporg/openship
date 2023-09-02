const formatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const dateFormatPlaceholder = formatter
  .formatToParts(new Date())
  .map((x) => {
    if (x.type === "day") {
      return "dd";
    }
    if (x.type === "month") {
      return "mm";
    }
    if (x.type === "year") {
      return "yyyy";
    }
    return x.value;
  })
  .join("");
