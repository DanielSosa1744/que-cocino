import { formatExpiryLabel } from '../lib/ingredientParser'
import type { InventoryItem } from '../types/app.types'

interface Props {
  item: InventoryItem
}

export default function UrgencyBadge({ item }: Props) {
  const label = formatExpiryLabel(item.days_until_expiry)
  
  const colorMap = {
    critical: 'bg-red-100 text-red-600',
    warning: 'bg-orange-100 text-orange-600',
    ok: 'bg-green-100 text-green-600',
  }

  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${colorMap[item.urgency]}`}>
      {label}
    </span>
  )
}
