interface StatusBadgeProps {
  isClockedIn: boolean
}

export function StatusBadge({ isClockedIn }: StatusBadgeProps) {
  return isClockedIn ? (
    <span className="badge-online">
      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
      במשמרת
    </span>
  ) : (
    <span className="badge-offline">
      <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
      לא במשמרת
    </span>
  )
}
