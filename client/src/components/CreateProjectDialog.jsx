import { useState } from "react";
import { XIcon } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { createProject } from "../api/projectApi";
import { addProjectToWorkspace } from "../features/workspaceSlice";
import toast from "react-hot-toast";

const CreateProjectDialog = ({ isDialogOpen, setIsDialogOpen }) => {
  const dispatch = useDispatch();
  const { currentWorkspace } = useSelector((state) => state.workspace);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "PLANNING",
    priority: "MEDIUM",
    start_date: "",
    end_date: "",
    team_members: [],
    team_lead: "",
    progress: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentWorkspace?._id) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        workspace: currentWorkspace._id,
      };
      const data = await createProject(payload);
      dispatch(addProjectToWorkspace(data.project));
      toast.success("Project created!");
      setIsDialogOpen(false);
      setFormData({
        name: "", description: "", status: "PLANNING", priority: "MEDIUM",
        start_date: "", end_date: "", team_members: [], team_lead: "", progress: 0,
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeTeamMember = (userId) => {
    setFormData((prev) => ({ ...prev, team_members: prev.team_members.filter((memberId) => memberId !== userId) }));
  };

  if (!isDialogOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur flex items-center justify-center text-left z-50">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 w-full max-w-lg text-zinc-900 dark:text-zinc-200 relative max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-3 right-3 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          onClick={() => setIsDialogOpen(false)}
        >
          <XIcon className="size-5" />
        </button>

        <h2 className="text-xl font-medium mb-1">Create New Project</h2>
        {currentWorkspace && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            In workspace: <span className="text-blue-600 dark:text-blue-400">{currentWorkspace.name}</span>
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Name */}
          <div>
            <label className="block text-sm mb-1">Project Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter project name"
              className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your project"
              className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm h-20"
            />
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
              >
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">End Date</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                min={formData.start_date}
                className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
              />
            </div>
          </div>

          {/* Lead */}
          <div>
            <label className="block text-sm mb-1">Project Lead</label>
            <select
              value={formData.team_lead}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({
                  ...formData,
                  team_lead: val,
                  team_members: val ? [...new Set([...formData.team_members, val])] : formData.team_members,
                });
              }}
              className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
            >
              <option value="">No lead</option>
              {currentWorkspace?.members?.map((member) => (
                <option key={member.user?._id} value={member.user?._id}>
                  {member.user?.name} ({member.user?.email})
                </option>
              ))}
            </select>
          </div>

          {/* Team Members */}
          <div>
            <label className="block text-sm mb-1">Team Members</label>
            <select
              className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-zinc-900 dark:text-zinc-200 text-sm"
              onChange={(e) => {
                const val = e.target.value;
                if (val && !formData.team_members.includes(val)) {
                  setFormData((prev) => ({ ...prev, team_members: [...prev.team_members, val] }));
                }
                e.target.value = "";
              }}
            >
              <option value="">Add team members</option>
              {currentWorkspace?.members
                ?.filter((m) => !formData.team_members.includes(m.user?._id))
                .map((member) => (
                  <option key={member.user?._id} value={member.user?._id}>
                    {member.user?.name} ({member.user?.email})
                  </option>
                ))}
            </select>

            {formData.team_members.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.team_members.map((userId) => {
                  const member = currentWorkspace.members.find((item) => item.user?._id === userId);
                  return (
                  <div
                    key={userId}
                    className="flex items-center gap-1 bg-blue-200/50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-md text-sm"
                  >
                    {member?.user?.name || member?.user?.email || userId}
                    <button type="button" onClick={() => removeTeamMember(userId)} className="ml-1">
                      <XIcon className="w-3 h-3" />
                    </button>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2 text-sm">
            <button
              type="button"
              onClick={() => setIsDialogOpen(false)}
              className="px-4 py-2 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !currentWorkspace}
              className="px-4 py-2 rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectDialog;