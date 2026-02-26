const formatDateSegment = (date: Date) =>
  `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`

const randomSuffix = (length = 4) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

export const generateTrackingId = (requestedBy: number | string) =>
  `D1-${formatDateSegment(new Date())}-S${requestedBy}-${randomSuffix()}`
