import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import StatsGrid from '../components/StatsGrid';
import ProjectOverview from '../components/ProjectOverview';
import CreateProjectDialog from '../components/CreateProjectDialog';
import ActivityFeed from '../components/ActivityFeed';
import TasksSummary from '../components/TasksSummary';
import { deleteWorkspace } from '../api/workspaceApi';
import { getWorkspaceActivities } from '../api/activityApi';
import { useDispatch, useSelector } from 'react-redux';
import { deleteWorkspace as deleteWorkspaceAction } from '../features/workspaceSlice';
import toast from "react-hot-toast";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { workspaces, currentWorkspace } = useSelector((state) => state.workspace);
  const user = useSelector((state) => state.auth.user);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!currentWorkspace?._id) return;
      setLoadingActivities(true);
      try {
        const data = await getWorkspaceActivities(currentWorkspace._id);
        setActivities(data.activities);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingActivities(false);
      }
    };
    fetchActivities();
  }, [currentWorkspace?._id]);

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
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <h2 className="text-xl font-semibold">
          No Workspace Found
        </h2>
        <p className="text-zinc-500 mt-2">
          Create a workspace to get started.
        </p>
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
        <button
          onClick={() => handleDeleteWorkspace(currentWorkspace._id)}
          className="  px-5 py-2 text-sm rounded bg-gradient-to-br from-red-500 to-red-600 text-white hover:opacity-90 transition"
        >
         Delete WorkSpace
        </button>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center gap-2 px-5 py-2 text-sm rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:opacity-90 transition"
        >
          <Plus size={16} /> New Project
        </button>
        <CreateProjectDialog isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
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