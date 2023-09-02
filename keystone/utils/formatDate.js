const formatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const formatDate = (date) => formatter.format(date);
