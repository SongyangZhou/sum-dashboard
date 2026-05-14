import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchOrders, fetchOrderSummary } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import { ClipboardList, Clock, TrendingUp, DollarSign, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

const STATUSES = ['Delivered', 'In Transit', 'Processing', 'On Hold', 'Cancelled']

type SortDir = 'asc' | 'desc'

const COLUMNS: { label: string; key: string | null }[] = [
  { label: 'Order #',     key: 'order_number' },
  { label: 'Customer',    key: 'customer' },
  { label: 'Product',     key: null },
  { label: 'Supplier',    key: null },
  { label: 'Qty',         key: 'quantity' },
  { label: 'Value',       key: 'total_value' },
  { label: 'Order Date',  key: 'order_date' },
  { label: 'Expected',    key: 'expected_delivery' },
  { label: 'Actual',      key: 'actual_delivery' },
  { label: 'Delay',       key: null },
  { label: 'Status',      key: 'status' },
]

function SortIcon({ col, sortBy, sortDir }: { col: string | null; sortBy: string; sortDir: SortDir }) {
  if (!col) return null
  if (sortBy !== col) return <ChevronsUpDown size={12} className="text-slate-400" />
  return sortDir === 'asc' ? <ChevronUp size={12} className="text-blue-500" /> : <ChevronDown size={12} className="text-blue-500" />
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Orders() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [sortBy, setSortBy] = useState('order_date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(key: string | null) {
    if (!key) return
    if (sortBy === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortDir('desc')
    }
    setPage(1)
  }

  const { data: summary } = useQuery({ queryKey: ['orderSummary'], queryFn: fetchOrderSummary })
  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, status, sortBy, sortDir],
    queryFn: () => fetchOrders({ page, page_size: 20, status: status || undefined, sort_by: sortBy, sort_dir: sortDir }),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Order Management</h1>
        <p className="text-slate-500 text-sm mt-1">End-to-end order lifecycle and fulfillment tracking</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: summary?.total_orders?.toLocaleString(), icon: <ClipboardList size={16} /> },
          { label: 'On-Time Delivery', value: `${summary?.on_time_delivery_rate ?? 0}%`, icon: <Clock size={16} />, colored: true, val: summary?.on_time_delivery_rate ?? 0 },
          { label: 'On-Hold Orders', value: summary?.on_hold_orders, icon: <TrendingUp size={16} />, warn: summary?.on_hold_orders > 0 },
          { label: 'Total Value', value: `$${(summary?.total_value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: <DollarSign size={16} /> },
        ].map(s => (
          <div key={s.label} className={`card ${s.warn ? 'border-yellow-200' : ''}`}>
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">{s.icon}{s.label}</div>
            <p className={`text-2xl font-bold ${s.warn ? 'text-yellow-600' : s.colored ? (s.val >= 95 ? 'text-green-600' : s.val >= 90 ? 'text-yellow-600' : 'text-red-600') : 'text-slate-900'}`}>
              {s.value ?? '—'}
            </p>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      {summary?.by_status && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-800">Status Breakdown</h2>
            {status && (
              <button
                className="text-xs text-blue-600 hover:underline"
                onClick={() => { setStatus(''); setPage(1) }}
              >
                Clear filter
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(summary.by_status as Record<string, number>).map(([s, count]) => (
              <button
                key={s}
                onClick={() => { setStatus(prev => prev === s ? '' : s); setPage(1) }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                  status === s
                    ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-400'
                    : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                <StatusBadge value={s} />
                <span className="text-sm font-medium text-slate-700">{count.toLocaleString()}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Orders table */}
      <div className="card">
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1) }}
          >
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {COLUMNS.map(({ label, key }) => (
                  <th
                    key={label}
                    className={`text-left py-2 px-3 text-slate-500 font-medium text-xs whitespace-nowrap select-none ${key ? 'cursor-pointer hover:text-slate-800' : ''}`}
                    onClick={() => handleSort(key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {label}
                      <SortIcon col={key} sortBy={sortBy} sortDir={sortDir} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={11} className="py-8 text-center text-slate-400">Loading...</td></tr>
              ) : (data?.items ?? []).map((o: Record<string, unknown>) => {
                const delay = o.delay_days as number | null
                return (
                  <tr key={String(o.id)} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono text-xs text-blue-600">{String(o.order_number)}</td>
                    <td className="py-2 px-3 text-slate-700 whitespace-nowrap">{String(o.customer)}</td>
                    <td className="py-2 px-3 text-slate-700 whitespace-nowrap">{String(o.product_name)}</td>
                    <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{String(o.supplier_name)}</td>
                    <td className="py-2 px-3">{Number(o.quantity).toLocaleString()}</td>
                    <td className="py-2 px-3 font-medium">${Number(o.total_value).toLocaleString()}</td>
                    <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{fmt(o.order_date as string)}</td>
                    <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{fmt(o.expected_delivery as string)}</td>
                    <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{fmt(o.actual_delivery as string)}</td>
                    <td className="py-2 px-3">
                      {delay != null ? (
                        <span className={delay <= 0 ? 'text-green-600 font-medium' : delay <= 3 ? 'text-yellow-600 font-medium' : 'text-red-600 font-medium'}>
                          {delay <= 0 ? `${Math.abs(delay)}d early` : `+${delay}d`}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-2 px-3"><StatusBadge value={String(o.status)} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {data && (
          <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
            <span>{data.total.toLocaleString()} orders</span>
            <div className="flex gap-2">
              <button className="btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
              <span className="py-2 px-3">Page {page} of {Math.ceil(data.total / 20)}</span>
              <button className="btn-secondary" onClick={() => setPage(p => p + 1)} disabled={page * 20 >= data.total}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
