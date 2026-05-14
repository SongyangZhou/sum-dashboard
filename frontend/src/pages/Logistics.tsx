import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { fetchShipments, fetchLogisticsSummary, fetchCarrierPerformance } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import { Truck, Clock, DollarSign, CheckCircle } from 'lucide-react'

const CARRIER_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']
const STATUSES = ['Delivered', 'In Transit', 'On Hold', 'Cancelled']

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Logistics() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [carrier, setCarrier] = useState('')

  const { data: summary } = useQuery({ queryKey: ['logSummary'], queryFn: fetchLogisticsSummary })
  const { data: carrierPerf } = useQuery({ queryKey: ['carrierPerf'], queryFn: fetchCarrierPerformance })
  const { data, isLoading } = useQuery({
    queryKey: ['shipments', page, status, carrier],
    queryFn: () => fetchShipments({ page, page_size: 20, status: status || undefined, carrier: carrier || undefined }),
  })

  const carriers: string[] = [...new Set(((carrierPerf ?? []) as { carrier: string }[]).map(c => c.carrier))]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Logistics & Fulfillment</h1>
        <p className="text-slate-500 text-sm mt-1">Shipment tracking, carrier performance, and freight costs</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Shipments', value: summary?.total_shipments?.toLocaleString(), icon: <Truck size={16} /> },
          { label: 'In Transit', value: summary?.in_transit, icon: <Clock size={16} /> },
          { label: 'On-Time Rate', value: `${summary?.on_time_delivery_rate ?? 0}%`, icon: <CheckCircle size={16} />, colored: true, val: summary?.on_time_delivery_rate ?? 0 },
          { label: 'Total Freight', value: `$${((summary?.total_freight_cost ?? 0) / 1000).toFixed(0)}k`, icon: <DollarSign size={16} /> },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">{s.icon}{s.label}</div>
            <p className={`text-2xl font-bold ${s.colored ? (s.val >= 95 ? 'text-green-600' : s.val >= 90 ? 'text-yellow-600' : 'text-red-600') : 'text-slate-900'}`}>
              {s.value ?? '—'}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Carrier On-Time Performance</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={carrierPerf ?? []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="carrier" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
              <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="on_time_rate" radius={[4, 4, 0, 0]} name="On-Time %">
                {(carrierPerf ?? []).map((_: unknown, i: number) => (
                  <Cell key={i} fill={CARRIER_COLORS[i % CARRIER_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Avg Freight Cost by Carrier</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={carrierPerf ?? []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="carrier" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="avg_freight_cost" radius={[4, 4, 0, 0]} name="Avg Freight $" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Shipments table */}
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
          <select
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
            value={carrier}
            onChange={e => { setCarrier(e.target.value); setPage(1) }}
          >
            <option value="">All Carriers</option>
            {carriers.map((c: string) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Tracking #', 'Order #', 'Carrier', 'Origin', 'Destination', 'Shipped', 'Est. Delivery', 'Actual', 'Delay', 'Freight', 'Status'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-slate-500 font-medium text-xs whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={11} className="py-8 text-center text-slate-400">Loading...</td></tr>
              ) : (data?.items ?? []).map((s: Record<string, unknown>) => {
                const delay = s.delay_days as number | null
                return (
                  <tr key={String(s.id)} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono text-xs text-slate-600">{String(s.tracking_number)}</td>
                    <td className="py-2 px-3 font-mono text-xs text-blue-600">{String(s.order_number)}</td>
                    <td className="py-2 px-3 font-medium text-slate-800">{String(s.carrier)}</td>
                    <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{String(s.origin)}</td>
                    <td className="py-2 px-3 text-slate-600 whitespace-nowrap max-w-[200px] truncate">{String(s.destination)}</td>
                    <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{fmt(s.shipped_date as string)}</td>
                    <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{fmt(s.estimated_delivery as string)}</td>
                    <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{fmt(s.actual_delivery as string)}</td>
                    <td className="py-2 px-3">
                      {delay != null ? (
                        <span className={delay <= 0 ? 'text-green-600 font-medium' : delay <= 3 ? 'text-yellow-600 font-medium' : 'text-red-600 font-medium'}>
                          {delay <= 0 ? `${Math.abs(delay)}d early` : `+${delay}d`}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-2 px-3 font-medium">${Number(s.freight_cost).toLocaleString()}</td>
                    <td className="py-2 px-3"><StatusBadge value={String(s.status)} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {data && (
          <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
            <span>{data.total.toLocaleString()} shipments</span>
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
