import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import AdminLayout from "../../components/AdminLayout";
import { adminAPI } from "../../lib/api";

const fmt   = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [page,   setPage]   = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, search, filter],
    queryFn:  () => adminAPI.getUsers({ page, limit: 20, search, status: filter }).then(r => r.data),
  });

  const blockMutation = useMutation({
    mutationFn: (id) => adminAPI.toggleUserBlock(id),
    onSuccess:  () => { qc.invalidateQueries(["admin-users"]); toast.success("User status updated"); },
    onError:    (e) => toast.error(e.response?.data?.message || "Failed"),
  });

  return (
    <AdminLayout title="Users">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text" placeholder="Search by name or email..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent flex-1 max-w-xs"
        />
        <div className="flex gap-2">
          {[["", "All Users"], ["active", "Active"], ["blocked", "Blocked"]].map(([val, label]) => (
            <button key={val} onClick={() => { setFilter(val); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                filter === val ? "bg-accent text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}>{label}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-500 self-center ml-auto">{data?.total || 0} users</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-gray-400">Loading users...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
                <th className="text-left px-5 py-3 font-semibold">User</th>
                <th className="text-left px-5 py-3 font-semibold">Orders</th>
                <th className="text-left px-5 py-3 font-semibold">Total Spent</th>
                <th className="text-left px-5 py-3 font-semibold">Joined</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
                <th className="text-left px-5 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {(data?.users || []).map((u) => (
                <tr key={u._id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-red-400 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-xs">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                        {u.phone && <p className="text-xs text-gray-400">{u.phone}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-semibold">{u.totalOrders}</td>
                  <td className="px-5 py-3 font-bold text-green-600">{fmt(u.totalSpent)}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{fmtDt(u.createdAt)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      u.isBlocked ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"
                    }`}>
                      {u.isBlocked ? "Blocked" : "Active"}
                    </span>
                    {u.isVerified && <span className="ml-1 text-xs text-blue-500">✓ Verified</span>}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => blockMutation.mutate(u._id)}
                        disabled={blockMutation.isPending}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                          u.isBlocked
                            ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                            : "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100"
                        }`}
                      >
                        {u.isBlocked ? "Unblock" : "Block"}
                      </button>
                      <button
                        onClick={() => toast("Opening order history...")}
                        className="border border-gray-200 text-gray-600 text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      >
                        Orders
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && data?.users?.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No users found</td></tr>
              )}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {data?.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <span className="text-xs text-gray-500">Page {data.page} of {data.pages} — {data.total} users</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-gray-50">← Prev</button>
              <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-gray-50">Next →</button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
