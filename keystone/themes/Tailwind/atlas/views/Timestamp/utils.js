import { parse, isValid, formatISO, format } from "date-fns"

const FULL_TIME_PATTERN = "HH:mm:ss.SSS"

function formatFullTime(date) {
  return format(date, FULL_TIME_PATTERN)
}

export function formatTime(time) {
  const date = parse(time, FULL_TIME_PATTERN, new Date())
  if (date.getMilliseconds() !== 0) {
    return format(date, FULL_TIME_PATTERN)
  }
  if (date.getSeconds() !== 0) {
    return format(date, "HH:mm:ss")
  }
  return format(date, "HH:mm")
}

export function parseTime(time) {
  for (const pattern of ["H:m:s.SSS", "H:m:s", "H:m", "H"]) {
    const parsed = parse(time, pattern, new Date())
    if (isValid(parsed)) {
      return format(parsed, FULL_TIME_PATTERN)
    }
  }
  return undefined
}

export function constructTimestamp({ dateValue, timeValue }) {
  return new Date(`${dateValue}T${timeValue}`).toISOString()
}

export function deconstructTimestamp(value) {
  return {
    dateValue: formatISO(new Date(value), { representation: "date" }),
    timeValue: { kind: "parsed", value: formatFullTime(new Date(value)) }
  }
}

export function formatOutput(value) {
  if (!value) return ""
  const date = new Date(value)
  return date.toLocaleString()
}
