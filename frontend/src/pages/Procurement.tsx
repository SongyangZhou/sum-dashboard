import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { fetchProcurement, fetchProcurementSummary, fetchSpendByCategory, fetchMonthlySpend } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import { DollarSign, Clock, ShoppingCart, CheckCircle } from 'lucide-react'

const PO_STATUSES = ['Open', 'Invoiced', 'Paid', 'Cancelled']
const CAT_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Procurement() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')

  const { data: summary } = useQuery({ queryKey: ['procSummary'], queryFn: fetchProcurementSummary })
  const { data: spendByCat } = useQuery({ queryKey: ['spendByCat'], queryFn: fetchSpendByCategory })
  const { data: monthlySpend } = useQuery({ queryKey: ['monthlySpend'], queryFn: fetchMonthlySpend })
  const { data, isLoading } = useQuery({
    queryKey: ['procurement', page, status],
    queryFn: () => fetchProcurement({ page, page_size: 20, status: status || undefined }),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Procurement & Accounts Payable</h1>
        <p className="text-slate-500 text-sm mt-1">Purchase orders, spend analysis, and payment tracking</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Spend', value: `$${((summary?.total_spend ?? 0) / 1_000_000).toFixed(2)}M`, icon: <DollarSign size={16} /> },
          { label: 'Avg PO Cycle', value: `${summary?.avg_cycle_days ?? 0}d`, icon: <Clock size={16} />, warn: (summary?.avg_cycle_days ?? 0) > 3 },
          { label: 'Open POs', value: summary?.open_pos, icon: <ShoppingCart size={16} /> },
          { label: 'Paid POs', value: summary?.paid_pos, icon: <CheckCircle size={16} /> },
        ].map(s => (
          <div key={s.label} className={`card ${s.warn ? 'border-yellow-200' : ''}`}>
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">{s.icon}{s.label}</div>
            <p className={`text-2xl font-bold ${s.warn ? 'text-yellow-600' : 'text-slate-900'}`}>{s.value ?? '—'}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Monthly Spend — Last 12 Months</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlySpend ?? []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Area type="monotone" dataKey="spend" stroke="#3b82f6" strokeWidth={2} fill="url(#spendGrad)" name="Spend" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Spend by Category</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={spendByCat ?? []} dataKey="spend" nameKey="category" cx="50%" cy="50%" outerRadius={80} paddingAngle={2}>
                {(spendByCat ?? []).map((_: unknown, i: number) => (
                  <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* PO Table */}
      <div className="card">
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1) }}
          >
            <option value="">All Statuses</option>
            {PO_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['PO #', 'Supplier', 'Product', 'Category', 'Qty', 'Total', 'Terms', 'Req. Date', 'PO Date', 'Invoice', 'Payment', 'Cycle', 'Status'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-slate-500 font-medium text-xs whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={13} className="py-8 text-center text-slate-400">Loading...</td></tr>
              ) : (data?.items ?? []).map((po: Record<string, unknown>) => (
                <tr key={String(po.id)} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2 px-3 font-mono text-xs text-blue-600">{String(po.po_number)}</td>
                  <td className="py-2 px-3 text-slate-700 whitespace-nowrap">{String(po.supplier_name)}</td>
                  <td className="py-2 px-3 text-slate-700 whitespace-nowrap">{String(po.product_name)}</td>
                  <td className="py-2 px-3 text-slate-500">{String(po.category)}</td>
                  <td className="py-2 px-3">{Number(po.quantity).toLocaleString()}</td>
                  <td className="py-2 px-3 font-medium">${Number(po.total_amount).toLocaleString()}</td>
                  <td className="py-2 px-3 text-slate-500">{String(po.payment_terms)}</td>
                  <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{fmt(po.requisition_date as string)}</td>
                  <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{fmt(po.po_date as string)}</td>
                  <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{fmt(po.invoice_date as string)}</td>
                  <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{fmt(po.payment_date as string)}</td>
                  <td className="py-2 px-3">
                    {po.cycle_days != null ? (
                      <span className={Number(po.cycle_days) <= 3 ? 'text-green-600' : 'text-yellow-600'}>
                        {Number(po.cycle_days)}d
                      </span>
                    ) : '—'}
                  </td>
                  <td className="py-2 px-3"><StatusBadge value={String(po.status)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && (
          <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
            <span>{data.total.toLocaleString()} purchase orders</span>
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
