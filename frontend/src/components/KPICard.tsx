import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPICardProps {
  title: string
  value: number | string
  unit?: string
  target?: number
  prev?: number
  lowerIsBetter?: boolean
  icon?: React.ReactNode
}

function getStatus(value: number, target: number, lowerIsBetter = false): 'green' | 'yellow' | 'red' {
  const ratio = lowerIsBetter ? target / value : value / target
  if (ratio >= 0.98) return 'green'
  if (ratio >= 0.92) return 'yellow'
  return 'red'
}

const statusColors = {
  green: 'text-green-600 bg-green-50 border-green-200',
  yellow: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  red: 'text-red-600 bg-red-50 border-red-200',
}

const statusBar = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  red: 'bg-red-500',
}

export default function KPICard({ title, value, unit, target, prev, lowerIsBetter, icon }: KPICardProps) {
  const numVal = typeof value === 'number' ? value : parseFloat(String(value))
  const status = target ? getStatus(numVal, target, lowerIsBetter) : 'green'
  const trend = prev !== undefined ? numVal - prev : null

  return (
    <div className={`card border ${statusColors[status]}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>

      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-slate-900">{typeof value === 'number' ? value.toLocaleString() : value}</span>
        {unit && <span className="text-slate-500 text-sm mb-1">{unit}</span>}
      </div>

      {target !== undefined && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Target: {target}{unit}</span>
            {trend !== null && (
              <span className={`flex items-center gap-0.5 ${trend > 0 && !lowerIsBetter ? 'text-green-600' : trend < 0 && !lowerIsBetter ? 'text-red-500' : trend < 0 && lowerIsBetter ? 'text-green-600' : 'text-red-500'}`}>
                {Math.abs(trend) < 0.1 ? <Minus size={10} /> : trend > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {Math.abs(trend).toFixed(1)}{unit}
              </span>
            )}
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${statusBar[status]}`}
              style={{ width: `${Math.min(100, lowerIsBetter ? (target / numVal) * 100 : (numVal / target) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
