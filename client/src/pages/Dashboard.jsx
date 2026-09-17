import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatsGrid from '../components/StatsGrid';
import ProjectOverview from '../components/ProjectOverview';
import CreateProjectDialog from '../components/CreateProjectDialog';
import TasksSummary from '../components/TasksSummary';
import CreateWorkspaceDialog from '../components/CreateWorkspaceDialog';
import { deleteWorkspace } from '../api/workspaceApi';
import { useDispatch, useSelector } from 'react-redux';
import { deleteWorkspace as deleteWorkspaceAction } from '../features/workspaceSlice';
import toast from "react-hot-toast";

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentWorkspace } = useSelector((state) => state.workspace);
  const user = useSelector((state) => state.auth.user);
  const userId = user?._id || user?.id;
  const workspaceOwnerId = currentWorkspace?.owner?._id || currentWorkspace?.owner;
  const isWorkspaceAdmin = Boolean(userId && workspaceOwnerId && String(userId) === String(workspaceOwnerId));
  const canStartProject = !user || isWorkspaceAdmin;

  const handleStartProject = () => {
    if (!user) {
      navigate("/login", { state: { redirectTo: "/" } });
      return;
    }
    setIsDialogOpen(true);
  };

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isWorkspaceDialogOpen, setIsWorkspaceDialogOpen] = useState(false);
  const handleDeleteWorkspace = async (workspaceId) => {
     console.log("Workspace ID:", workspaceId);
    const confirmDelete = window.confirm('Are you sure you want to delete this workspace?');
    if (!confirmDelete) return;
    try {
      await deleteWorkspace(workspaceId);
      dispatch(deleteWorkspaceAction(workspaceId));
    } catch (error) {
  toast.error(
    error.response?.data?.message || "Failed to delete workspace"
  );
}
  };

  if (!currentWorkspace) {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <div className="max-w-xl text-center">
        <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-blue-600 uppercase dark:text-blue-400">ProjectFlow workspace</p>
        <h2 className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">Bring your next project into focus.</h2>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-gray-500 dark:text-zinc-400">
          Plan work, bring your team together, and keep every project moving from one clear workspace.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button onClick={() => user ? setIsWorkspaceDialogOpen(true) : navigate("/login", { state: { redirectTo: "/" } })} className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
            {user ? "Create a workspace" : "Sign in to get started"}
          </button>
          {!user && (
            <button onClick={() => navigate("/register", { state: { redirectTo: "/" } })} className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800">
              Create account
            </button>
          )}
        </div>
        {user && <CreateWorkspaceDialog isOpen={isWorkspaceDialogOpen} onClose={() => setIsWorkspaceDialogOpen(false)} />}
      </div>
    </div>
  );
}
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
            Welcome back, {user?.name || 'User'}
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm">
            Here's what's happening with your projects today
          </p>
        </div>
        {isWorkspaceAdmin && (
          <button
            onClick={() => handleDeleteWorkspace(currentWorkspace._id)}
            className="  px-5 py-2 text-sm rounded bg-gradient-to-br from-red-500 to-red-600 text-white hover:opacity-90 transition"
          >
           Delete WorkSpace
          </button>
        )}
        {canStartProject && (
          <>
            <button
              onClick={handleStartProject}
              className="flex items-center gap-2 px-5 py-2 text-sm rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:opacity-90 transition"
            >
              <Plus size={16} /> New Project
            </button>
            {user && <CreateProjectDialog isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />}
          </>
        )}
      </div>

      {/* Stats */}
      <StatsGrid />

      {/* Workspaces */}
     

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <ProjectOverview />
        </div>
        <div className="space-y-8">
          <TasksSummary />
        
        </div>
      </div>
    </div>
  );
};

export default Dashboard;