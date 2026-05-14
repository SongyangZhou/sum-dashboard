import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  fetchDashboardKPIs, fetchOrderTrend, fetchOrderStatus,
  fetchTopSuppliers, fetchInventoryByCategory,
} from '../api/client'
import KPICard from '../components/KPICard'
import { Package, ClipboardList, TrendingUp, Truck, ShoppingCart, CheckCircle } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  Delivered: '#22c55e',
  'In Transit': '#3b82f6',
  Processing: '#94a3b8',
  'On Hold': '#eab308',
  Cancelled: '#ef4444',
}

const CAT_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

export default function Dashboard() {
  const { data: kpis } = useQuery({ queryKey: ['kpis'], queryFn: fetchDashboardKPIs })
  const { data: trend } = useQuery({ queryKey: ['orderTrend'], queryFn: fetchOrderTrend })
  const { data: statusData } = useQuery({ queryKey: ['orderStatus'], queryFn: fetchOrderStatus })
  const { data: topSuppliers } = useQuery({ queryKey: ['topSuppliers'], queryFn: fetchTopSuppliers })
  const { data: invByCategory } = useQuery({ queryKey: ['invByCategory'], queryFn: fetchInventoryByCategory })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Executive Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Supply chain performance overview — last 30 days</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis && (
          <>
            <KPICard
              title="On-Time Delivery Rate"
              value={kpis.on_time_delivery_rate.value}
              unit="%"
              target={kpis.on_time_delivery_rate.target}
              prev={kpis.on_time_delivery_rate.prev}
              icon={<Truck size={18} />}
            />
            <KPICard
              title="Perfect Order Rate"
              value={kpis.perfect_order_rate.value}
              unit="%"
              target={kpis.perfect_order_rate.target}
              icon={<CheckCircle size={18} />}
            />
            <KPICard
              title="Inventory Turnover"
              value={kpis.inventory_turnover.value}
              unit="x/yr"
              target={kpis.inventory_turnover.target}
              icon={<Package size={18} />}
            />
            <KPICard
              title="Fill Rate"
              value={kpis.fill_rate.value}
              unit="%"
              target={kpis.fill_rate.target}
              icon={<TrendingUp size={18} />}
            />
            <KPICard
              title="PO Cycle Time"
              value={kpis.po_cycle_time.value}
              unit=" days"
              target={kpis.po_cycle_time.target}
              lowerIsBetter
              icon={<ShoppingCart size={18} />}
            />
            <KPICard
              title="Active Orders"
              value={kpis.active_orders.value}
              unit=" orders"
              icon={<ClipboardList size={18} />}
            />
          </>
        )}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Order Volume — Last 12 Months</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trend ?? []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} dot={false} name="Total Orders" />
              <Line type="monotone" dataKey="delivered" stroke="#22c55e" strokeWidth={2} dot={false} name="Delivered" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Orders by Status</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={statusData ?? []}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                dataKey="count"
                nameKey="status"
                paddingAngle={2}
              >
                {(statusData ?? []).map((entry: { status: string }, i: number) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.status] ?? '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Top Suppliers — On-Time Delivery %</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topSuppliers ?? []} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} width={120} />
              <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="on_time_delivery" fill="#3b82f6" radius={[0, 4, 4, 0]} name="On-Time %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Inventory by Category</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={invByCategory ?? []} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="category" tick={{ fontSize: 10 }} tickLine={false} angle={-30} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="quantity" radius={[4, 4, 0, 0]} name="Units">
                {(invByCategory ?? []).map((_: unknown, i: number) => (
                  <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
