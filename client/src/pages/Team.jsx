import { useEffect, useState } from "react";
import { UsersIcon, Search, UserPlus, Shield, Activity, User, Copy, KeyRound, Check, X, Clock } from "lucide-react";
import InviteMemberDialog from "../components/InviteMemberDialog";
import { useDispatch, useSelector } from "react-redux";
import API from "../api/axios";
import { setWorkspaces } from "../features/workspaceSlice";
import toast from "react-hot-toast";


const Team = () => {

    const [tasks, setTasks] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [users, setUsers] = useState([]);
    const [joinCode, setJoinCode] = useState("");
    const [joinRequests, setJoinRequests] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [isSubmittingCode, setIsSubmittingCode] = useState(false);
    const [reviewingRequest, setReviewingRequest] = useState(null);
    const [processingInvitation, setProcessingInvitation] = useState(null);
    const dispatch = useDispatch();
    const currentWorkspace = useSelector((state) => state?.workspace?.currentWorkspace || null);
    const projects = currentWorkspace?.projects || [];
    const { user } = useSelector(state => state.auth);
    const userId = user?.id || user?._id;
    const ownerId = currentWorkspace?.owner?._id || currentWorkspace?.owner?.id || currentWorkspace?.owner;
    const isOwner = Boolean(userId && ownerId && String(ownerId) === String(userId));

    const filteredUsers = users.filter(
        (user) =>
            user?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user?.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        setUsers(currentWorkspace?.members || []);
        setTasks(currentWorkspace?.projects?.reduce((acc, project) => [...acc, ...(project.tasks || [])], []) || []);
    }, [currentWorkspace]);

    useEffect(() => {
        const fetchInvitations = async () => {
            if (!user) return setInvitations([]);
            try {
                const res = await API.get("/workspaces/my-invitations");
                setInvitations(res.data.invitations || []);
            } catch (error) {
                toast.error(error?.response?.data?.message || "Failed to load invitations");
            }
        };
        fetchInvitations();
    }, [user?.id, user?._id]);

    useEffect(() => {
        const fetchJoinRequests = async () => {
            if (!currentWorkspace?._id || !isOwner) return setJoinRequests([]);
            try {
                const res = await API.get(`/workspaces/${currentWorkspace._id}/join-requests`);
                setJoinRequests(res.data.requests || []);
            } catch (error) {
                toast.error(error?.response?.data?.message || "Failed to load join requests");
            }
        };
        fetchJoinRequests();
    }, [currentWorkspace?._id, isOwner]);

    const respondToInvitation = async (token, action) => {
        setProcessingInvitation(token);
        try {
            const invitation = invitations.find((item) => item.token === token);
            const endpoint = action === "accept" && invitation?.type === "PROJECT"
                ? `/invitations/${token}/accept`
                : `/workspaces/invite/${token}/${action}`;
            await API.post(endpoint);
            setInvitations((current) => current.filter((invitation) => invitation.token !== token));
            if (action === "accept") {
                const refreshed = await API.get("/workspaces");
                dispatch(setWorkspaces(refreshed.data.workspaces));
            }
            toast.success(action === "accept" ? "Workspace joined!" : "Invitation declined");
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to update invitation");
        } finally {
            setProcessingInvitation(null);
        }
    };

    const submitJoinRequest = async (event) => {
        event.preventDefault();
        if (!joinCode.trim()) return;
        setIsSubmittingCode(true);
        try {
            const res = await API.post("/workspaces/join-requests", { code: joinCode });
            toast.success(res.data.message);
            setJoinCode("");
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to send join request");
        } finally {
            setIsSubmittingCode(false);
        }
    };

    const copyJoinCode = async () => {
        await navigator.clipboard.writeText(currentWorkspace.joinCode);
        toast.success("Workspace code copied");
    };

    const reviewJoinRequest = async (requestId, status) => {
        setReviewingRequest(requestId);
        try {
            await API.patch(`/workspaces/${currentWorkspace._id}/join-requests/${requestId}`, { status });
            setJoinRequests((requests) => requests.filter((request) => request._id !== requestId));
            if (status === "APPROVED") {
                const refreshed = await API.get("/workspaces");
                dispatch(setWorkspaces(refreshed.data.workspaces));
            }
            toast.success(status === "APPROVED" ? "Member approved" : "Request rejected");
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to review request");
        } finally {
            setReviewingRequest(null);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-1">Team</h1>
                    <p className="text-gray-500 dark:text-zinc-400 text-sm">
                        Manage team members and their contributions
                    </p>
                </div>
                <button onClick={() => setIsDialogOpen(true)} className="flex items-center px-5 py-2 rounded text-sm bg-gradient-to-br from-blue-500 to-blue-600 hover:opacity-90 text-white transition" >
                    <UserPlus className="w-4 h-4 mr-2" /> Invite Member
                </button>
                <InviteMemberDialog isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="border border-blue-200 dark:border-blue-500/30 rounded-lg p-5 bg-blue-50/60 dark:bg-blue-500/5">
                    <div className="flex items-center gap-2 mb-1">
                        <KeyRound className="size-4 text-blue-600 dark:text-blue-400" />
                        <h2 className="font-semibold text-gray-900 dark:text-white">Workspace code</h2>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">Share this code with people who need to request access.</p>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 rounded border border-blue-200 dark:border-blue-500/30 bg-white dark:bg-zinc-900 px-3 py-2 text-lg font-semibold tracking-[0.2em] text-blue-700 dark:text-blue-300">
                            {currentWorkspace?.joinCode || "Unavailable"}
                        </code>
                        <button type="button" onClick={copyJoinCode} disabled={!currentWorkspace?.joinCode} className="p-2 rounded border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/10 disabled:opacity-50" title="Copy workspace code">
                            <Copy className="size-4" />
                        </button>
                    </div>
                </div>

                <form onSubmit={submitJoinRequest} className="border border-gray-200 dark:border-zinc-800 rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-1">
                        <UsersIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                        <h2 className="font-semibold text-gray-900 dark:text-white">Join another workspace</h2>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">Enter a workspace code to send an access request to its owner.</p>
                    <div className="flex gap-2">
                        <input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder="8-character code" maxLength={8} className="flex-1 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm tracking-widest focus:outline-none focus:border-blue-500" />
                        <button type="submit" disabled={isSubmittingCode || !joinCode.trim()} className="px-4 py-2 rounded bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-50">{isSubmittingCode ? "Sending..." : "Request access"}</button>
                    </div>
                </form>
            </div>

            {invitations.length > 0 && (
                <section className="border border-blue-200 dark:border-blue-500/30 rounded-lg p-5 bg-blue-50/50 dark:bg-blue-500/5">
                    <div className="flex items-center gap-2 mb-4">
                        <UserPlus className="size-4 text-blue-600 dark:text-blue-400" />
                        <h2 className="font-semibold text-gray-900 dark:text-white">Pending invitations ({invitations.length})</h2>
                    </div>
                    <div className="space-y-3">
                        {invitations.map((invitation) => (
                            <div key={invitation._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded border border-blue-200 dark:border-blue-500/20 bg-white dark:bg-zinc-900 p-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{invitation.workspace?.name || "Workspace invitation"}</p>
                                    <p className="text-xs text-gray-500 dark:text-zinc-400">Invited by {invitation.invitedBy?.name || "a teammate"}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => respondToInvitation(invitation.token, "accept")} disabled={processingInvitation === invitation.token} className="flex items-center gap-1 px-3 py-1.5 rounded bg-blue-600 text-white text-xs hover:bg-blue-700 disabled:opacity-50"><Check className="size-3" /> Accept</button>
                                    <button type="button" onClick={() => respondToInvitation(invitation.token, "decline")} disabled={processingInvitation === invitation.token} className="flex items-center gap-1 px-3 py-1.5 rounded border border-red-200 text-red-600 text-xs hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10 disabled:opacity-50"><X className="size-3" /> Reject</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {isOwner && joinRequests.length > 0 && (
                <section className="border border-amber-200 dark:border-amber-500/30 rounded-lg p-5 bg-amber-50/50 dark:bg-amber-500/5">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock className="size-4 text-amber-600 dark:text-amber-400" />
                        <h2 className="font-semibold text-gray-900 dark:text-white">Pending join requests ({joinRequests.length})</h2>
                    </div>
                    <div className="space-y-3">
                        {joinRequests.map((request) => (
                            <div key={request._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded border border-amber-200 dark:border-amber-500/20 bg-white dark:bg-zinc-900 p-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{request.user?.name || "Unknown user"}</p>
                                    <p className="text-xs text-gray-500 dark:text-zinc-400">{request.user?.email}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => reviewJoinRequest(request._id, "APPROVED")} disabled={reviewingRequest === request._id} className="flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-600 text-white text-xs hover:bg-emerald-700 disabled:opacity-50"><Check className="size-3" /> Approve</button>
                                    <button type="button" onClick={() => reviewJoinRequest(request._id, "REJECTED")} disabled={reviewingRequest === request._id} className="flex items-center gap-1 px-3 py-1.5 rounded border border-red-200 text-red-600 text-xs hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10 disabled:opacity-50"><X className="size-3" /> Reject</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Stats Cards */}
            <div className="flex flex-wrap gap-4">
                {/* Total Members */}
                <div className="max-sm:w-full dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-gray-300 dark:border-zinc-800 rounded-lg p-6">
                    <div className="flex items-center justify-between gap-8 md:gap-22">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-zinc-400">Total Members</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{users.length}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-500/10">
                            <UsersIcon className="size-4 text-blue-500 dark:text-blue-200" />
                        </div>
                    </div>
                </div>

                {/* Active Projects */}
                <div className="max-sm:w-full dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-gray-300 dark:border-zinc-800 rounded-lg p-6">
                    <div className="flex items-center justify-between gap-8 md:gap-22">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-zinc-400">Active Projects</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {projects.filter((p) => p.status !== "CANCELLED" && p.status !== "COMPLETED").length}
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/10">
                            <Activity className="size-4 text-emerald-500 dark:text-emerald-200" />
                        </div>
                    </div>
                </div>

                {/* Total Tasks */}
                <div className="max-sm:w-full dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-gray-300 dark:border-zinc-800 rounded-lg p-6">
                    <div className="flex items-center justify-between gap-8 md:gap-22">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-zinc-400">Total Tasks</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{tasks.length}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-500/10">
                            <Shield className="size-4 text-purple-500 dark:text-purple-200" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-zinc-400 size-3" />
                <input placeholder="Search team members..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 w-full text-sm rounded-md border border-gray-300 dark:border-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-400 py-2 focus:outline-none focus:border-blue-500" />
            </div>

            {/* Team Members */}
            <div className="w-full">
                {filteredUsers.length === 0 ? (
                    <div className="col-span-full text-center py-16">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                            <UsersIcon className="w-12 h-12 text-gray-400 dark:text-zinc-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            {users.length === 0
                                ? "No team members yet"
                                : "No members match your search"}
                        </h3>
                        <p className="text-gray-500 dark:text-zinc-400 mb-6">
                            {users.length === 0
                                ? "Invite team members to start collaborating"
                                : "Try adjusting your search term"}
                        </p>
                    </div>
                ) : (
                    <div className="max-w-4xl w-full">
                        {/* Desktop Table */}
                        <div className="hidden sm:block overflow-x-auto rounded-md border border-gray-200 dark:border-zinc-800">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
                                <thead className="bg-gray-50 dark:bg-zinc-900/50">
                                    <tr>
                                        <th className="px-6 py-2.5 text-left font-medium text-sm">
                                            Name
                                        </th>
                                        <th className="px-6 py-2.5 text-left font-medium text-sm">
                                            Email
                                        </th>
                                        <th className="px-6 py-2.5 text-left font-medium text-sm">
                                            Role
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                                    {filteredUsers.map((user) => (
                                        <tr
                                            key={user.user?._id}
                                            className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                                        >
                                            <td className="px-6 py-2.5 whitespace-nowrap flex items-center gap-3">
                                                <div className="size-7 rounded-full bg-blue-600 flex items-center justify-center">
    <User className="w-4 h-4 text-white" />
</div>
                                                <span className="text-sm text-zinc-800 dark:text-white truncate">
                                                    {user.user?.name || "Unknown User"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-2.5 whitespace-nowrap text-sm text-gray-500 dark:text-zinc-400">
                                                {user.user.email}
                                            </td>
                                            <td className="px-6 py-2.5 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-1 text-xs rounded-md ${user.role === "ADMIN"
                                                            ? "bg-purple-100 dark:bg-purple-500/20 text-purple-500 dark:text-purple-400"
                                                            : "bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300"
                                                        }`}
                                                >
                                                    {user.role || "User"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="sm:hidden space-y-3">
                            {filteredUsers.map((user) => (
                                <div
                                    key={user.user?._id}
                                    className="p-4 border border-gray-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <img
                                            src={user.user.image}
                                            alt={user.user.name}
                                            className="size-9 rounded-full bg-gray-200 dark:bg-zinc-800"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {user.user?.name || "Unknown User"}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-zinc-400">
                                                {user.user.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <span
                                            className={`px-2 py-1 text-xs rounded-md ${user.role === "ADMIN"
                                                    ? "bg-purple-100 dark:bg-purple-500/20 text-purple-500 dark:text-purple-400"
                                                    : "bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300"
                                                }`}
                                        >
                                            {user.role || "User"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>


        </div>
    );
};

export default Team;