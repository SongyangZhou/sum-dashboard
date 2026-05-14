import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const fetchDashboardKPIs = () => api.get('/dashboard/kpis').then(r => r.data)
export const fetchOrderTrend = () => api.get('/dashboard/order-trend').then(r => r.data)
export const fetchOrderStatus = () => api.get('/dashboard/order-status').then(r => r.data)
export const fetchTopSuppliers = () => api.get('/dashboard/top-suppliers').then(r => r.data)
export const fetchInventoryByCategory = () => api.get('/dashboard/inventory-by-category').then(r => r.data)

export const fetchInventory = (params: Record<string, unknown>) =>
  api.get('/inventory/', { params }).then(r => r.data)
export const fetchInventorySummary = () => api.get('/inventory/summary').then(r => r.data)
export const fetchInventoryByRegion = () => api.get('/inventory/by-region').then(r => r.data)
export const fetchInventoryCategories = () => api.get('/inventory/categories').then(r => r.data)

export const fetchSuppliers = () => api.get('/suppliers/').then(r => r.data)
export const fetchSupplierRiskDistribution = () => api.get('/suppliers/risk-distribution').then(r => r.data)
export const fetchSupplierSpendByCategory = () => api.get('/suppliers/spend-by-category').then(r => r.data)

export const fetchOrders = (params: Record<string, unknown>) =>
  api.get('/orders/', { params }).then(r => r.data)
export const fetchOrderSummary = () => api.get('/orders/summary').then(r => r.data)

export const fetchProcurement = (params: Record<string, unknown>) =>
  api.get('/procurement/', { params }).then(r => r.data)
export const fetchProcurementSummary = () => api.get('/procurement/summary').then(r => r.data)
export const fetchSpendByCategory = () => api.get('/procurement/spend-by-category').then(r => r.data)
export const fetchMonthlySpend = () => api.get('/procurement/monthly-spend').then(r => r.data)

export const fetchShipments = (params: Record<string, unknown>) =>
  api.get('/logistics/', { params }).then(r => r.data)
export const fetchLogisticsSummary = () => api.get('/logistics/summary').then(r => r.data)
export const fetchCarrierPerformance = () => api.get('/logistics/carrier-performance').then(r => r.data)
