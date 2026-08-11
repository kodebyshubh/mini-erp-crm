const COLORS: Record<string, string> = {
  LEAD: "badge-gray",
  ACTIVE: "badge-green",
  INACTIVE: "badge-gray",
  DRAFT: "badge-gray",
  CONFIRMED: "badge-green",
  CANCELLED: "badge-red",
  ORDERED: "badge-blue",
  RECEIVED: "badge-green",
  IN: "badge-green",
  OUT: "badge-red",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${COLORS[status] ?? "badge-gray"}`}>{status}</span>;
}
