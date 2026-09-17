import { useState, useRef, useEffect } from "react";
import { Activity, X, ChevronRight, Clock, Folder, CheckSquare, Building2 } from "lucide-react";
import { useSelector } from "react-redux";
import { getWorkspaceActivities } from "../api/activityApi";

const entityIcon = (type) => {
  switch (type) {
    case "PROJECT": return <Folder className="size-3 text-blue-500" />;
    case "TASK":    return <CheckSquare className="size-3 text-emerald-500" />;
    default:        return <Building2 className="size-3 text-purple-500" />;
  }
};

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

const ActivitySidebar = ({ onShowAll }) => {
  const { currentWorkspace } = useSelector((s) => s.workspace);
  const [activities, setActivities]   = useState([]);
  const [loading, setLoading]         = useState(false);
  const [hovering, setHovering]       = useState(false);
  const [popupOpen, setPopupOpen]     = useState(false);
  const popupRef   = useRef(null);
  const buttonRef  = useRef(null);
  const hoverTimer = useRef(null);

  // fetch on workspace change
  useEffect(() => {
    if (!currentWorkspace?._id) return;
    setLoading(true);
    getWorkspaceActivities(currentWorkspace._id)
      .then((d) => setActivities(d.activities || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentWorkspace?._id]);

  // close popup on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        popupRef.current && !popupRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        setPopupOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMouseEnter = () => {
    hoverTimer.current = setTimeout(() => setHovering(true), 200);
  };
  const handleMouseLeave = () => {
    clearTimeout(hoverTimer.current);
    setHovering(false);
  };

  const preview = activities.slice(0, 5);

  return (
    <div className="mt-2 px-3 relative">
      {/* Section header row */}
      <div
        ref={buttonRef}
        className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 group"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => setPopupOpen((p) => !p)}
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
          <h3 className="text-sm font-medium text-gray-700 dark:text-zinc-300">Recent Activity</h3>
          {activities.length > 0 && (
            <span className="bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-xs px-2 py-0.5 rounded">
              {activities.length}
            </span>
          )}
        </div>
        <ChevronRight
          className={`w-4 h-4 text-gray-500 dark:text-zinc-400 transition-transform duration-200 ${popupOpen ? "rotate-90" : ""}`}
        />
      </div>

      {/* Hover preview tooltip */}
      {hovering && !popupOpen && activities.length > 0 && (
        <div
          className="absolute left-full top-0 ml-2 z-50 w-72 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-2xl overflow-hidden"
          onMouseEnter={() => { clearTimeout(hoverTimer.current); setHovering(true); }}
          onMouseLeave={handleMouseLeave}
        >
          <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800 flex items-center gap-2">
            <Activity className="size-4 text-blue-500" />
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Recent Activity</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-zinc-800 max-h-72 overflow-y-auto">
            {loading ? (
              <p className="text-xs text-gray-500 dark:text-zinc-400 text-center py-4">Loading...</p>
            ) : (
              preview.map((a) => (
                <div key={a._id} className="px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-zinc-800 transition">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex-shrink-0">{entityIcon(a.entityType)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 dark:text-zinc-200 truncate leading-snug">
                        {a.action}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock className="size-2.5 text-gray-400 dark:text-zinc-500" />
                        <p className="text-xs text-gray-400 dark:text-zinc-500">{timeAgo(a.createdAt)}</p>
                        {a.user?.name && (
                          <p className="text-xs text-gray-400 dark:text-zinc-500">· {a.user.name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setHovering(false); onShowAll(); }}
            className="w-full px-4 py-2.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition font-medium text-center border-t border-gray-100 dark:border-zinc-800"
          >
            Show all activity →
          </button>
        </div>
      )}

      {/* Inline expanded list */}
      {popupOpen && (
        <div className="mt-1 pl-2">
          {loading ? (
            <p className="text-xs text-gray-500 dark:text-zinc-500 px-3 py-2">Loading...</p>
          ) : activities.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-zinc-500 px-3 py-2 text-center">No activity yet</p>
          ) : (
            <div className="space-y-1">
              {preview.map((a) => (
                <div
                  key={a._id}
                  className="flex items-start gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
                >
                  <div className="mt-0.5 flex-shrink-0">{entityIcon(a.entityType)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-800 dark:text-zinc-200 truncate">
                      {a.action}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{timeAgo(a.createdAt)}</p>
                  </div>
                </div>
              ))}
              {activities.length > 5 && (
                <button
                  onClick={onShowAll}
                  className="w-full text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-3 py-2 text-left font-medium"
                >
                  Show more ({activities.length - 5} more) →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivitySidebar;