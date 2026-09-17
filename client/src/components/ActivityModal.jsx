import { useEffect, useState } from "react";
import { X, Activity, Clock, Folder, CheckSquare, Building2, RefreshCw } from "lucide-react";
import { useSelector } from "react-redux";
import { getWorkspaceActivities } from "../api/activityApi";

const entityIcon = (type) => {
  switch (type) {
    case "PROJECT": return <Folder className="size-4 text-blue-500" />;
    case "TASK":    return <CheckSquare className="size-4 text-emerald-500" />;
    default:        return <Building2 className="size-4 text-purple-500" />;
  }
};

const entityBadge = (type) => {
  switch (type) {
    case "PROJECT": return "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400";
    case "TASK":    return "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400";
    default:        return "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400";
  }
};

const timeAgo = (date) => {
  const diff  = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  if (days < 7)   return `${days} day${days !== 1 ? "s" : ""} ago`;
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const ActivityModal = ({ onClose }) => {
  const { currentWorkspace } = useSelector((s) => s.workspace);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState("ALL");

  const fetch = async () => {
    if (!currentWorkspace?._id) return;
    setLoading(true);
    try {
      const d = await getWorkspaceActivities(currentWorkspace._id);
      setActivities(d.activities || []);
    } catch (error) {
      console.error("Failed to load workspace activity", error);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [currentWorkspace?._id]);

  // close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const filtered = filter === "ALL"
    ? activities
    : activities.filter((a) => a.entityType === filter);

  const grouped = filtered.reduce((acc, a) => {
    const day = new Date(a.createdAt).toLocaleDateString("en-IN", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    if (!acc[day]) acc[day] = [];
    acc[day].push(a);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl max-h-[85vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-500/10">
              <Activity className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">All Activity</h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                {currentWorkspace?.name} · {activities.length} events
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetch}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition text-gray-500 dark:text-zinc-400"
              title="Refresh"
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition text-gray-500 dark:text-zinc-400"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-6 py-3 border-b border-gray-100 dark:border-zinc-800 flex-shrink-0">
          {["ALL", "WORKSPACE", "PROJECT", "TASK"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
              }`}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Activity list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="size-6 animate-spin text-blue-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Activity className="size-10 mx-auto text-gray-300 dark:text-zinc-600 mb-3" />
              <p className="text-gray-500 dark:text-zinc-400 text-sm">No activity found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([day, items]) => (
                <div key={day}>
                  <p className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-3">
                    {day}
                  </p>
                  <div className="space-y-1 border-l-2 border-gray-100 dark:border-zinc-800 pl-4">
                    {items.map((a) => (
                      <div
                        key={a._id}
                        className="relative flex items-start gap-3 py-3 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800/60 transition group"
                      >
                        {/* Timeline dot */}
                        <div className="absolute -left-5 top-4 w-2 h-2 rounded-full bg-gray-300 dark:bg-zinc-600 group-hover:bg-blue-500 transition" />

                        {/* Icon */}
                        <div className="flex-shrink-0 mt-0.5 p-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800">
                          {entityIcon(a.entityType)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 leading-snug">
                              {a.action}
                            </p>
                            <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${entityBadge(a.entityType)}`}>
                              {a.entityType.charAt(0) + a.entityType.slice(1).toLowerCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {a.user?.name && (
                              <div className="flex items-center gap-1">
                                <div className="size-4 rounded-full bg-blue-600 flex items-center justify-center text-white text-[9px] font-bold">
                                  {a.user.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-xs text-gray-500 dark:text-zinc-400">{a.user.name}</span>
                              </div>
                            )}
                            <span className="text-gray-300 dark:text-zinc-600">·</span>
                            <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-zinc-500">
                              <Clock className="size-3" />
                              {timeAgo(a.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityModal;