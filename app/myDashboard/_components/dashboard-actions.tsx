export function DashboardActions({ status }: { status?: string }) {
  return status ? <p className="flex h-7 items-center px-2 text-xs text-white/55">{status}</p> : null
}
