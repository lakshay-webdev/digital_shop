import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import { useAuthStore } from "../store";
import api, { authAPI } from "../lib/api";
import { FiUser, FiMail, FiPhone, FiMapPin, FiEdit2, FiTrash2, FiPlus, FiLock, FiSave } from "react-icons/fi";

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, setAuth, logout } = useAuthStore();
  const [tab, setTab] = useState("profile");
  const [loading, setLoading] = useState(false);

  // Profile form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Address form
  const [addresses, setAddresses] = useState([]);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [addrForm, setAddrForm] = useState({
    label: "Home", fullName: "", phone: "", line1: "", line2: "", city: "", state: "", pinCode: "", isDefault: false,
  });

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    setName(user?.name || "");
    setPhone(user?.phone || "");
    fetchProfile();
  }, [token]);

  const fetchProfile = async () => {
    try {
      const { data } = await authAPI.getMe();
      setAddresses(data.user.addresses || []);
    } catch (e) { /* auth interceptor handles 401 */ }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put("/users/profile", { name, phone });
      useAuthStore.getState().updateUser({ name: data.user.name, phone: data.user.phone });
      toast.success("Profile updated!");
    } catch (e) {
      toast.error(e.response?.data?.message || "Update failed");
    } finally { setLoading(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await api.put("/users/change-password", { currentPassword, newPassword });
      toast.success("Password changed!");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to change password");
    } finally { setLoading(false); }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/users/addresses", addrForm);
      setAddresses(data.addresses);
      setShowAddrForm(false);
      setAddrForm({ label: "Home", fullName: "", phone: "", line1: "", line2: "", city: "", state: "", pinCode: "", isDefault: false });
      toast.success("Address added!");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to add address");
    } finally { setLoading(false); }
  };

  const handleDeleteAddress = async (addrId) => {
    try {
      const { data } = await api.delete(`/users/addresses/${addrId}`);
      setAddresses(data.addresses);
      toast.success("Address removed");
    } catch (e) { toast.error("Failed to delete address"); }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
    toast.success("Logged out");
  };

  if (!token) return null;

  const tabs = [
    { key: "profile", label: "Profile", icon: <FiUser /> },
    { key: "addresses", label: "Addresses", icon: <FiMapPin /> },
    { key: "security", label: "Security", icon: <FiLock /> },
  ];

  return (
    <>
      <Head><title>My Profile | DigiSho</title></Head>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="font-display text-3xl font-bold mb-8">My <span className="text-accent">Account</span></h1>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 bg-gray-100 rounded-xl p-1 w-fit">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.key ? "bg-white shadow-sm text-primary" : "text-gray-500 hover:text-primary"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === "profile" && (
          <div className="bg-white rounded-2xl shadow-card p-8 max-w-lg">
            <h2 className="text-lg font-semibold mb-6">Personal Information</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Full Name</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" value={user?.email || ""} disabled
                    className="w-full pl-10 pr-4 py-3 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Phone</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-accent transition-colors"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                <FiSave /> {loading ? "Saving..." : "Save Changes"}
              </button>
            </form>

            <hr className="my-8 border-gray-100" />
            <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">
              Logout from this device
            </button>
          </div>
        )}

        {/* Addresses Tab */}
        {tab === "addresses" && (
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Saved Addresses</h2>
              <button onClick={() => setShowAddrForm(!showAddrForm)}
                className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
              >
                <FiPlus /> Add Address
              </button>
            </div>

            {/* Add Address Form */}
            {showAddrForm && (
              <form onSubmit={handleAddAddress} className="bg-white rounded-2xl shadow-card p-6 mb-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Label</label>
                    <select value={addrForm.label} onChange={e => setAddrForm({...addrForm, label: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                    >
                      <option>Home</option><option>Work</option><option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Full Name</label>
                    <input type="text" required value={addrForm.fullName} onChange={e => setAddrForm({...addrForm, fullName: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Phone</label>
                    <input type="tel" required value={addrForm.phone} onChange={e => setAddrForm({...addrForm, phone: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">PIN Code</label>
                    <input type="text" required value={addrForm.pinCode} onChange={e => setAddrForm({...addrForm, pinCode: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Address Line 1</label>
                  <input type="text" required value={addrForm.line1} onChange={e => setAddrForm({...addrForm, line1: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Address Line 2</label>
                  <input type="text" value={addrForm.line2} onChange={e => setAddrForm({...addrForm, line2: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">City</label>
                    <input type="text" required value={addrForm.city} onChange={e => setAddrForm({...addrForm, city: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">State</label>
                    <input type="text" required value={addrForm.state} onChange={e => setAddrForm({...addrForm, state: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={addrForm.isDefault} onChange={e => setAddrForm({...addrForm, isDefault: e.target.checked})} />
                  Set as default address
                </label>
                <div className="flex gap-3">
                  <button type="submit" disabled={loading} className="bg-accent text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60">
                    {loading ? "Saving..." : "Save Address"}
                  </button>
                  <button type="button" onClick={() => setShowAddrForm(false)} className="border border-gray-200 px-5 py-2.5 rounded-lg text-sm hover:border-gray-400 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Address Cards */}
            {addresses.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-card p-10 text-center text-gray-400">
                <FiMapPin className="mx-auto text-3xl mb-3" />
                <p>No saved addresses yet.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {addresses.map(addr => (
                  <div key={addr._id} className="bg-white rounded-2xl shadow-card p-5 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-gray-100 text-xs font-semibold px-2.5 py-1 rounded-lg">{addr.label}</span>
                        {addr.isDefault && <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-lg">Default</span>}
                      </div>
                      <p className="font-medium text-sm">{addr.fullName}</p>
                      <p className="text-sm text-gray-500">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                      <p className="text-sm text-gray-500">{addr.city}, {addr.state} — {addr.pinCode}</p>
                      <p className="text-sm text-gray-400 mt-1">📞 {addr.phone}</p>
                    </div>
                    <button onClick={() => handleDeleteAddress(addr._id)} className="text-gray-400 hover:text-red-500 transition-colors p-2">
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Security Tab */}
        {tab === "security" && (
          <div className="bg-white rounded-2xl shadow-card p-8 max-w-lg">
            <h2 className="text-lg font-semibold mb-6">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Current Password</label>
                <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">New Password</label>
                <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Confirm New Password</label>
                <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors" />
              </div>
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                <FiLock /> {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}

ProfilePage.getLayout = (page) => <Layout>{page}</Layout>;
