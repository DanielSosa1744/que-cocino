import { formatExpiryLabel } from '../lib/ingredientParser'
import type { InventoryItem } from '../types/app.types'

interface Props {
  item: InventoryItem
}

export default function UrgencyBadge({ item }: Props) {
  const label = formatExpiryLabel(item.days_until_expiry)
  
  const colorMap = {
    critical: 'bg-rose-50 text-rose-700 border border-rose-200/60',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200/60',
    ok: 'bg-emerald-50 text-emerald-800 border border-emerald-200/60',
  }

  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${colorMap[item.urgency]}`}>
      {label}
    </span>
  )
}
