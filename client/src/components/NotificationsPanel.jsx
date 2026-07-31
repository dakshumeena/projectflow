import { useEffect, useState, useRef } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import { Bell, X, Check, Clock, ChevronRight, Inbox } from "lucide-react";

// ── Slide-over panel ──────────────────────────────────────────────────────────
const NotificationsPanel = ({ isOpen, onClose }) => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const panelRef = useRef(null);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const res = await API.get("/workspaces/my-invitations");
      setInvitations(res.data.invitations);
    } catch {
      // silently fail – backend route may not exist yet
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchInvitations();
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  const acceptInvitation = async (token) => {
    setAccepting(token);
    try {
      await API.post(`/workspaces/invite/${token}/accept`);
      toast.success("Workspace joined!");
      setInvitations((prev) => prev.filter((inv) => inv.token !== token));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to accept invitation");
    } finally {
      setAccepting(null);
    }
  };
  const declineInvitation = async (token) => {
  try {
    await API.post(`/workspaces/invite/${token}/decline`);

    setInvitations((prev) =>
      prev.filter((inv) => inv.token !== token)
    );

    toast.success("Invitation declined");
  } catch (err) {
    toast.error(
      err?.response?.data?.message || "Failed to decline invitation"
    );
  }
};

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Slide-over panel */}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-500/10">
              <Bell className="size-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Notifications</h2>
              {!loading && invitations.length > 0 && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {invitations.length} pending invitation{invitations.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col gap-3 p-5">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-2 animate-pulse"
                >
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
                  <div className="h-3 bg-zinc-100 dark:bg-zinc-700 rounded w-1/2" />
                  <div className="h-8 bg-zinc-100 dark:bg-zinc-700 rounded-lg w-28 mt-3" />
                </div>
              ))}
            </div>
          ) : invitations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
              <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
                <Inbox className="size-7 text-zinc-400 dark:text-zinc-500" />
              </div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">All caught up</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                Workspace invitations will show up here
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {invitations.map((invite) => (
                <InviteCard
  key={invite._id}
  invite={invite}
  onAccept={acceptInvitation}
  onDecline={declineInvitation}
  isAccepting={accepting === invite.token}
/>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ── Individual invite card ─────────────────────────────────────────────────────
const InviteCard = ({
  invite,
  onAccept,
  onDecline,
  isAccepting,
}) => (
  <div className="group rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 p-4">
    {/* Top row */}
    <div className="flex items-start justify-between gap-2 mb-3">
      <div className="flex items-center gap-2.5">
        <div className="size-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {invite.workspace?.name?.charAt(0)?.toUpperCase() || "W"}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
            {invite.workspace?.name || "Workspace"}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            from {invite.invitedBy?.name || "a teammate"}
          </p>
        </div>
      </div>
      <span className="flex-shrink-0 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
        <Clock className="size-3" /> Pending
      </span>
    </div>

    {/* CTA */}
   <div className="flex gap-2">
  <button
    onClick={() => onAccept(invite.token)}
    disabled={isAccepting}
    className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium bg-gradient-to-br from-blue-500 to-blue-600 hover:opacity-90 text-white transition disabled:opacity-60"
  >
    {isAccepting ? (
      <>
        <svg
          className="size-3.5 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          />
        </svg>
        Joining...
      </>
    ) : (
      <>
        <Check className="size-3.5" />
        Accept
      </>
    )}
  </button>

  <button
    onClick={() => onDecline(invite.token)}
    className="flex-1 py-2 px-4 rounded-lg border border-zinc-300 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
  >
    Decline
  </button>
</div>
  </div>
);

// ── Bell trigger button (drop this into Navbar) ───────────────────────────────
export const NotificationBell = ({ count = 0 }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative size-8 flex items-center justify-center bg-white dark:bg-zinc-800 shadow rounded-lg transition hover:scale-105 active:scale-95"
      >
        <Bell className="size-4 text-gray-700 dark:text-gray-200" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 size-4 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>
      <NotificationsPanel isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};

const Notifications = () => {
  return (
    <div className="p-6">
      <NotificationsPanel
        isOpen={true}
        onClose={() => {}}
      />
    </div>
  );
};

export default Notifications;