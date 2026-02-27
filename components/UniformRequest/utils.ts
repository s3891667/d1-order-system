export function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "REQUEST":
      return "bg-blue-100 text-blue-700";
    case "DISPATCHED":
      return "bg-indigo-100 text-indigo-700";
    case "IN_TRANSIT":
      return "bg-violet-100 text-violet-700";
    case "ARRIVED":
      return "bg-amber-100 text-amber-800";
    case "COLLECTED":
      return "bg-emerald-100 text-emerald-700";
    case "COMPLETED":
      return "bg-teal-100 text-teal-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}
