import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  User, Mail, Lock, Bell, Palette, Shield, Trash2,
  Save, Eye, EyeOff, Check, Moon, Sun, Monitor,
} from "lucide-react";
import { toggleTheme } from "../features/themeSlice";
import { logout, loginSuccess } from "../features/authSlice";
import API from "../api/axios";
import toast from "react-hot-toast";

const TABS = [
  { key: "profile",       label: "Profile",       icon: User },
  { key: "security",      label: "Security",       icon: Lock },
  { key: "appearance",    label: "Appearance",     icon: Palette },
  { key: "notifications", label: "Notifications",  icon: Bell },
  { key: "danger",        label: "Danger Zone",    icon: Shield },
];
const FONT_SIZE_VALUES = { Small: "14px", Medium: "16px", Large: "18px" };

export default function Settings() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { user }  = useSelector((s) => s.auth);
  const { theme } = useSelector((s) => s.theme);
  const { currentWorkspace } = useSelector((s) => s.workspace);

  const [activeTab, setActiveTab] = useState("profile");

  /* ── Profile state ── */
  const [profile, setProfile]         = useState({ name: user?.name || "", email: user?.email || "" });
  const [savingProfile, setSavingProfile] = useState(false);

  /* ── Security state ── */
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [showPw, setShowPw]       = useState({ current: false, newPass: false, confirm: false });
  const [savingPw, setSavingPw]   = useState(false);

  /* ── Notifications state ── */
  const [notifs, setNotifs] = useState({
    taskAssigned:   true,
    projectUpdated: true,
    memberJoined:   false,
    weeklyDigest:   false,
  });
  const [savingNotifs, setSavingNotifs] = useState(false);
  const [fontSize, setFontSize] = useState(() => localStorage.getItem("fontSize") || "Medium");

  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SIZE_VALUES[fontSize];
    localStorage.setItem("fontSize", fontSize);
  }, [fontSize]);

  /* ── Sync user to profile form ── */
  useEffect(() => {
    if (user) setProfile({ name: user.name || "", email: user.email || "" });
  }, [user]);

  useEffect(() => {
    const loadNotificationPreferences = async () => {
      try {
        const res = await API.get("/auth/notification-preferences");
        setNotifs((current) => ({ ...current, ...res.data.preferences }));
      } catch {
        // Keep the default preferences when loading is unavailable.
      }
    };
    if (user) loadNotificationPreferences();
  }, [user]);

  /* ─────────────── Handlers ─────────────── */

  const handleSaveProfile = async () => {
    if (!profile.name.trim()) return toast.error("Name cannot be empty");
    setSavingProfile(true);
    try {
      const res = await API.patch("/auth/profile", {
        name: profile.name.trim(),
      });

      dispatch(loginSuccess({
        token: localStorage.getItem("token"),
        user: res.data.user,
      }));
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.current)               return toast.error("Enter your current password");
    if (passwords.newPass.length < 6)     return toast.error("New password must be at least 6 characters");
    if (passwords.newPass !== passwords.confirm) return toast.error("Passwords do not match");
    setSavingPw(true);
    try {
      await API.patch("/auth/change-password", {
        currentPassword: passwords.current,
        newPassword:     passwords.newPass,
      });
      toast.success("Password changed!");
      setPasswords({ current: "", newPass: "", confirm: "" });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to change password");
    } finally {
      setSavingPw(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you absolutely sure? This will permanently delete your account and all associated data."
    );
    if (!confirmed) return;
    const doubleConfirm = window.prompt('Type "DELETE" to confirm');
    if (doubleConfirm !== "DELETE") return toast.error("Account deletion cancelled");
    try {
      await API.delete("/auth/account");
      dispatch(logout());
      navigate("/");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete account");
    }
  };

  /* ─────────────── UI helpers ─────────────── */

  const inputCls =
    "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition";

  const cardCls =
    "bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 space-y-5";

  /* ─────────────── Render ─────────────── */

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Manage your account and preferences
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar tabs */}
        <aside className="md:w-52 flex-shrink-0">
          <nav className="space-y-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  activeTab === t.key
                    ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium"
                    : "text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                } ${t.key === "danger" ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10" : ""}`}
              >
                <t.icon className="size-4 flex-shrink-0" />
                {t.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">

          {/* ── Profile ── */}
          {activeTab === "profile" && (
            <div className={cardCls}>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Profile Information</h2>

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {profile.name.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{profile.name || "—"}</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">{profile.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <input
                      className={inputCls + " pl-9"}
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      placeholder="Your name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <input
                      className={inputCls + " pl-9 opacity-60 cursor-not-allowed"}
                      value={profile.email}
                      disabled
                      title="Email cannot be changed"
                    />
                  </div>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                    Current Workspace
                  </label>
                  <input
                    className={inputCls + " opacity-60 cursor-not-allowed"}
                    value={currentWorkspace?.name || "—"}
                    disabled
                  />
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition disabled:opacity-50"
              >
                <Save className="size-4" />
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}

          {/* ── Security ── */}
          {activeTab === "security" && (
            <div className={cardCls}>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Change Password</h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 -mt-2">
                Use a strong password with at least 6 characters
              </p>

              {[
                { key: "current", label: "Current Password" },
                { key: "newPass", label: "New Password" },
                { key: "confirm", label: "Confirm New Password" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                    {label}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <input
                      type={showPw[key] ? "text" : "password"}
                      className={inputCls + " pl-9 pr-10"}
                      value={passwords[key]}
                      onChange={(e) => setPasswords({ ...passwords, [key]: e.target.value })}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((p) => ({ ...p, [key]: !p[key] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw[key] ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={handleChangePassword}
                disabled={savingPw}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition disabled:opacity-50"
              >
                <Lock className="size-4" />
                {savingPw ? "Changing..." : "Change Password"}
              </button>
            </div>
          )}

          {/* ── Appearance ── */}
          {activeTab === "appearance" && (
            <div className={cardCls}>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Appearance</h2>

              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">Theme</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: "light", label: "Light", icon: Sun },
                    { val: "dark",  label: "Dark",  icon: Moon },
                  ].map((option) => (
                    <button
                      key={option.val}
                      onClick={() => { if (theme !== option.val) dispatch(toggleTheme()); }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition ${
                        theme === option.val
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                          : "border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600"
                      }`}
                    >
                      <option.icon className={`size-5 ${theme === option.val ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-zinc-400"}`} />
                      <span className={`text-sm font-medium ${theme === option.val ? "text-blue-700 dark:text-blue-400" : "text-gray-700 dark:text-zinc-300"}`}>
                        {option.label}
                      </span>
                      {theme === option.val && <Check className="size-4 text-blue-600 dark:text-blue-400 ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-zinc-800 pt-4">
                <p className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Font Size</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mb-3">Adjust the text size across the app</p>
                <div className="flex gap-2">
                  {["Small", "Medium", "Large"].map((size) => (
                    <button
                      key={size}
                      onClick={() => setFontSize(size)}
                      className={`px-4 py-2 rounded-lg text-sm border transition ${
                        size === fontSize
                          ? "border-blue-500 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10"
                          : "border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-gray-300"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Notifications ── */}
          {activeTab === "notifications" && (
            <div className={cardCls}>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Notification Preferences</h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 -mt-2">
                Choose what you want to be notified about
              </p>

              <div className="space-y-4">
                {[
                  { key: "taskAssigned",   label: "Task assigned to me",    desc: "When a task is assigned to you" },
                  { key: "projectUpdated", label: "Project updates",         desc: "When a project you're in is updated" },
                  { key: "memberJoined",   label: "Member joined",           desc: "When someone joins your workspace" },
                  { key: "weeklyDigest",   label: "Weekly digest",           desc: "A weekly summary of workspace activity" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-zinc-800 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{label}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">{desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifs((n) => ({ ...n, [key]: !n[key] }))}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                        notifs[key] ? "bg-blue-600" : "bg-gray-300 dark:bg-zinc-600"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                          notifs[key] ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={async () => {
                  setSavingNotifs(true);
                  try {
                    const res = await API.patch("/auth/notification-preferences", notifs);
                    setNotifs((current) => ({ ...current, ...res.data.preferences }));
                    toast.success("Notification preferences saved!");
                  } catch (err) {
                    toast.error(err?.response?.data?.message || "Failed to save notification preferences");
                  } finally {
                    setSavingNotifs(false);
                  }
                }}
                disabled={savingNotifs}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition"
              >
                <Save className="size-4" /> {savingNotifs ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          )}

          {/* ── Danger Zone ── */}
          {activeTab === "danger" && (
            <div className={cardCls + " border-red-200 dark:border-red-900"}>
              <h2 className="text-base font-semibold text-red-700 dark:text-red-400">Danger Zone</h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 -mt-2">
                These actions are irreversible. Please proceed with caution.
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-500/5">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Delete Account</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                      Permanently delete your account and all your data
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition flex-shrink-0"
                  >
                    <Trash2 className="size-4" /> Delete
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-500/5">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Log Out Everywhere</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                      Sign out of all devices and sessions
                    </p>
                  </div>
                  <button
                    onClick={() => { dispatch(logout()); navigate("/login"); }}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg transition flex-shrink-0"
                  >
                    <Shield className="size-4" /> Logout All
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
