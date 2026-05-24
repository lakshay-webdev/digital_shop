import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import AdminLayout from "../../components/AdminLayout";
import { adminAPI } from "../../lib/api";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const StatCard = ({ icon, label, value, sub, color }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-start gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>{icon}</div>
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{label}</p>
      <p className="text-2xl font-bold text-primary mt-0.5">{value}</p>
      {sub && <p className="text-xs text-green-600 font-medium mt-0.5">{sub}</p>}
    </div>
  </div>
);

const COLORS = ["#16a34a", "#0369a1", "#d97706", "#dc2626", "#7c3aed", "#db2777"];

export default function DashboardPage() {
  const { data: stats }   = useQuery({ queryKey: ["admin-stats"],   queryFn: () => adminAPI.getStats().then(r => r.data.stats) });
  const { data: chart }   = useQuery({ queryKey: ["revenue-chart"], queryFn: () => adminAPI.getRevenueChart(7).then(r => r.data.data) });
  const { data: orders }  = useQuery({ queryKey: ["recent-orders"], queryFn: () => adminAPI.getRecentOrders().then(r => r.data.orders) });
  const { data: topProds} = useQuery({ queryKey: ["top-products"],  queryFn: () => adminAPI.getTopProducts().then(r => r.data.products) });
  const { data: breakdown}= useQuery({ queryKey: ["order-breakdown"],queryFn: () => adminAPI.getOrderBreakdown().then(r => r.data.breakdown) });

  return (
    <AdminLayout title="Dashboard">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon="💰" label="Total Revenue"    value={fmt(stats?.totalRevenue)} sub={`↑ ${stats?.revenueGrowth || 0}% this month`} color="bg-blue-50" />
        <StatCard icon="📦" label="Total Orders"     value={stats?.totalOrders?.toLocaleString() || "—"} sub={`${stats?.todayOrders || 0} today`} color="bg-green-50" />
        <StatCard icon="👥" label="Total Users"      value={stats?.totalUsers?.toLocaleString() || "—"} sub={`+${stats?.newUsersMonth || 0} this month`} color="bg-amber-50" />
        <StatCard icon="⏳" label="Pending Orders"   value={stats?.pendingOrders || "—"} sub="Needs attention" color="bg-red-50" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        {/* Revenue Chart */}
        <div className="xl:col-span-2 bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="font-semibold text-sm mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chart || []}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#e94560" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#e94560" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [fmt(v), "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="#e94560" strokeWidth={2} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Order Breakdown Pie */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="font-semibold text-sm mb-4">Order Status</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={breakdown || []} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={70}>
                {(breakdown || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {(breakdown || []).slice(0, 4).map((b, i) => (
              <div key={b._id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-gray-600 capitalize">{b._id?.replace("_", " ")}</span>
                </div>
                <span className="font-semibold">{b.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Recent Orders */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h3 className="font-semibold text-sm">Recent Orders</h3>
            <a href="/orders" className="text-xs text-accent font-medium hover:underline">View All →</a>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase">
              <th className="text-left px-5 py-3 font-semibold">Order</th>
              <th className="text-left px-5 py-3 font-semibold">Amount</th>
              <th className="text-left px-5 py-3 font-semibold">Status</th>
            </tr></thead>
            <tbody>
              {(orders || []).map((o) => (
                <tr key={o._id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-accent text-xs">#{o.orderId}</p>
                    <p className="text-xs text-gray-500">{o.user?.name}</p>
                  </td>
                  <td className="px-5 py-3 font-semibold">{fmt(o.totalAmount)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      o.status === "delivered"     ? "bg-green-50 text-green-700"  :
                      o.status === "pending"       ? "bg-amber-50 text-amber-700"  :
                      o.status === "cancelled"     ? "bg-red-50 text-red-700"      :
                      o.status === "shipped"       ? "bg-purple-50 text-purple-700":
                      "bg-blue-50 text-blue-700"
                    }`}>
                      {o.status?.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Products */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h3 className="font-semibold text-sm">Top Selling Products</h3>
            <a href="/products" className="text-xs text-accent font-medium hover:underline">View All →</a>
          </div>
          <div className="p-5 space-y-4">
            {(topProds || []).map((p, i) => (
              <div key={p._id} className="flex items-center gap-3">
                <span className="w-6 text-xs font-bold text-gray-400">#{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.brand}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-accent">{fmt(p.price)}</p>
                  <p className="text-xs text-gray-400">{p.soldCount} sold</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
