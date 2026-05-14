import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { fetchInventory, fetchInventorySummary, fetchInventoryByRegion, fetchInventoryCategories } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import { AlertTriangle, Package, TrendingDown, TrendingUp } from 'lucide-react'

const REGION_COLORS = ['#3b82f6', '#22c55e', '#f59e0b']

export default function Inventory() {
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState('')
  const [alert, setAlert] = useState('')

  const { data: summary } = useQuery({ queryKey: ['invSummary'], queryFn: fetchInventorySummary })
  const { data: byRegion } = useQuery({ queryKey: ['invByRegion'], queryFn: fetchInventoryByRegion })
  const { data: categories } = useQuery({ queryKey: ['invCategories'], queryFn: fetchInventoryCategories })
  const { data, isLoading } = useQuery({
    queryKey: ['inventory', page, category, alert],
    queryFn: () => fetchInventory({ page, page_size: 20, category: category || undefined, alert: alert || undefined }),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
        <p className="text-slate-500 text-sm mt-1">Real-time stock levels across all warehouses</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total SKUs', value: summary?.total_skus, icon: <Package size={16} /> },
          { label: 'Total Units', value: summary?.total_units?.toLocaleString(), icon: <Package size={16} /> },
          { label: 'Low Stock', value: summary?.low_stock_alerts, icon: <TrendingDown size={16} />, warn: true },
          { label: 'Out of Stock', value: summary?.out_of_stock, icon: <AlertTriangle size={16} />, danger: true },
          { label: 'Overstock', value: summary?.overstock_alerts, icon: <TrendingUp size={16} />, yellow: true },
        ].map(s => (
          <div key={s.label} className={`card ${s.danger ? 'border-red-200' : s.warn ? 'border-yellow-200' : s.yellow ? 'border-amber-200' : ''}`}>
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">{s.icon}{s.label}</div>
            <p className={`text-2xl font-bold ${s.danger ? 'text-red-600' : s.warn ? 'text-yellow-600' : s.yellow ? 'text-amber-600' : 'text-slate-900'}`}>
              {s.value ?? '—'}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory by region chart */}
        <div className="card">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Stock by Region</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byRegion ?? []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="region" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="quantity" radius={[4, 4, 0, 0]} name="Units">
                {(byRegion ?? []).map((_: unknown, i: number) => (
                  <Cell key={i} fill={REGION_COLORS[i % REGION_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Filters + table */}
        <div className="lg:col-span-2 card">
          <div className="flex flex-wrap gap-3 mb-4">
            <select
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
              value={category}
              onChange={e => { setCategory(e.target.value); setPage(1) }}
            >
              <option value="">All Categories</option>
              {(categories ?? []).map((c: string) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
              value={alert}
              onChange={e => { setAlert(e.target.value); setPage(1) }}
            >
              <option value="">All Stock Levels</option>
              <option value="low">Low / Out of Stock</option>
              <option value="overstock">Overstock</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['SKU', 'Product', 'Warehouse', 'Region', 'Qty', 'Reorder Pt', 'Status'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-slate-500 font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="py-8 text-center text-slate-400">Loading...</td></tr>
                ) : (data?.items ?? []).map((row: Record<string, unknown>) => (
                  <tr key={String(row.id)} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono text-xs text-slate-600">{String(row.sku)}</td>
                    <td className="py-2 px-3 text-slate-800">{String(row.product_name)}</td>
                    <td className="py-2 px-3 text-slate-600">{String(row.warehouse)}</td>
                    <td className="py-2 px-3 text-slate-600">{String(row.region)}</td>
                    <td className="py-2 px-3 font-medium">{Number(row.quantity).toLocaleString()}</td>
                    <td className="py-2 px-3 text-slate-500">{Number(row.reorder_point).toLocaleString()}</td>
                    <td className="py-2 px-3"><StatusBadge value={String(row.status)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && (
            <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
              <span>{data.total} records</span>
              <div className="flex gap-2">
                <button className="btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
                <span className="py-2 px-3">Page {page}</span>
                <button className="btn-secondary" onClick={() => setPage(p => p + 1)} disabled={page * 20 >= data.total}>Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
