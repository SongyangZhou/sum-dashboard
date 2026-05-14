type BadgeVariant = 'green' | 'yellow' | 'red' | 'blue' | 'gray'

const map: Record<string, BadgeVariant> = {
  Delivered: 'green',
  'In Transit': 'blue',
  Processing: 'gray',
  'On Hold': 'yellow',
  Cancelled: 'red',
  Paid: 'green',
  Invoiced: 'blue',
  Open: 'gray',
  low: 'red',
  ok: 'green',
  overstock: 'yellow',
  out_of_stock: 'red',
  high: 'red',
  medium: 'yellow',
}

const classes: Record<BadgeVariant, string> = {
  green: 'badge-green',
  yellow: 'badge-yellow',
  red: 'badge-red',
  blue: 'badge-blue',
  gray: 'badge-gray',
}

const labels: Record<string, string> = {
  out_of_stock: 'Out of Stock',
  low: 'Low Stock',
  ok: 'In Stock',
  overstock: 'Overstock',
}

export default function StatusBadge({ value }: { value: string }) {
  const variant = map[value] ?? 'gray'
  return <span className={classes[variant]}>{labels[value] ?? value}</span>
}
