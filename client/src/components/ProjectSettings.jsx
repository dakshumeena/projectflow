import { format } from "date-fns";
import { Plus, Save } from "lucide-react";
import { useEffect, useState } from "react";
import AddProjectMember from "./AddProjectMember";
import { updateProject } from "../api/projectApi";
import toast from "react-hot-toast";

export default function ProjectSettings({ project, onProjectUpdated, canEditDetails = true }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "PLANNING",
    priority: "MEDIUM",
    start_date: "",
    end_date: "",
    progress: 0,
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Safe date formatter – returns "yyyy-MM-dd" or "" if invalid
  const toInputDate = (val) => {
    if (!val) return "";
    try {
      return format(new Date(val), "yyyy-MM-dd");
    } catch {
      return "";
    }
  };

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || "",
        description: project.description || "",
        status: project.status || "PLANNING",
        priority: project.priority || "MEDIUM",
        start_date: toInputDate(project.start_date),
        end_date: toInputDate(project.end_date),
        progress: project.progress || 0,
      });
    }
  }, [project]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = await updateProject(project._id, formData);
      toast.success("Project saved!");
      if (onProjectUpdated) onProjectUpdated(data.project);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses =
    "w-full px-3 py-2 rounded mt-2 border text-sm dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-300";
  const cardClasses =
    "rounded-lg border p-6 not-dark:bg-white dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border-zinc-300 dark:border-zinc-800";
  const labelClasses = "text-sm text-zinc-600 dark:text-zinc-400";

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Project Details */}
      <div className={cardClasses}>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-300 mb-4">Project Details</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className={labelClasses}>Project Name</label>
            <input
              value={formData.name}
              disabled={!canEditDetails}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputClasses}
              required
            />
          </div>

          <div className="space-y-2">
            <label className={labelClasses}>Description</label>
            <textarea
              value={formData.description}
              disabled={!canEditDetails}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={inputClasses + " h-24"}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={labelClasses}>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className={inputClasses}
              >
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className={labelClasses}>Priority</label>
              <select
                value={formData.priority}
                disabled={!canEditDetails}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className={inputClasses}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={labelClasses}>Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                disabled={!canEditDetails}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className={inputClasses}
              />
            </div>
            <div className="space-y-2">
              <label className={labelClasses}>End Date</label>
              <input
                type="date"
                value={formData.end_date}
                disabled={!canEditDetails}
                min={formData.start_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className={inputClasses}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelClasses}>Progress: {formData.progress}%</label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={formData.progress}
              onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
              className="w-full accent-blue-500 dark:accent-blue-400"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="ml-auto flex items-center text-sm justify-center gap-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            <Save className="size-4" /> {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Team Members */}
      <div className="space-y-6">
        <div className={cardClasses}>
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-300">
              Team Members{" "}
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                ({project?.members?.length || 0})
              </span>
            </h2>
            {canEditDetails && <button
              type="button"
              onClick={() => setIsDialogOpen(true)}
              className="p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Plus className="size-4 text-zinc-900 dark:text-zinc-300" />
            </button>}
            {canEditDetails && <AddProjectMember isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />}
          </div>

          {project?.members?.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {project.members.map((member, index) => (
                <div
                  key={member._id || index}
                  className="flex items-center justify-between px-3 py-2 rounded dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-300"
                >
                  <div className="flex items-center gap-2">
                    {member.user?.image && (
                      <img src={member.user.image} className="size-6 rounded-full" alt="" />
                    )}
                    <span>{member.user?.name || member.user?.email || "Unknown"}</span>
                  </div>
                  {project.team_lead === member.user?._id && (
                    <span className="px-2 py-0.5 rounded text-xs ring ring-zinc-200 dark:ring-zinc-600">
                      Team Lead
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}