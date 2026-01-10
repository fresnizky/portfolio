function CheckmarkIcon() {
  return (
    <svg
      data-testid="checkmark-icon"
      className="h-8 w-8 text-green-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

export function EmptyAlertsState() {
  return (
    <div
      data-testid="empty-alerts-state"
      className="rounded-lg border border-green-200 bg-green-50 p-6 text-center"
    >
      <div className="mb-2 flex justify-center">
        <CheckmarkIcon />
      </div>
      <h3 className="text-lg font-semibold text-green-800">Portfolio is on track!</h3>
      <p className="mt-1 text-sm text-green-600">
        No alerts or actions needed at this time.
      </p>
    </div>
  )
}
