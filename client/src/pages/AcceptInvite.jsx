import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { CheckCircle, XCircle, FolderOpen, Building2 } from "lucide-react";
import { getInvitationDetails, acceptInvitation } from "../api/invitationApi";
import toast from "react-hot-toast";

const AcceptInvite = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const data = await getInvitationDetails(token);
        setInvitation(data.invitation);
      } catch (err) {
        setError(err?.response?.data?.message || "Invalid or expired invitation");
      } finally {
        setLoading(false);
      }
    };
    fetchInvite();
  }, [token]);

  const handleAccept = async () => {
    if (!isAuthenticated) {
      // Step 5a: remember this invite so we can come back after login/register
      localStorage.setItem("pendingInviteToken", token);
      navigate("/login", { state: { redirectTo: `/invite/${token}` } });
      return;
    }
    setAccepting(true);
    try {
      const data = await acceptInvitation(token);
      toast.success(data.message || "Invitation accepted!");
      setAccepted(true);
      setTimeout(() => {
        if (data.type === "PROJECT" && data.project) {
          navigate(`/projectsDetail?id=${data.project._id}&tab=tasks`);
        } else {
          navigate("/");
        }
      }, 1500);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to accept invitation");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-gray-500">Loading invitation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <XCircle className="size-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Invitation Invalid</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link to="/" className="text-indigo-600 font-semibold hover:underline">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <CheckCircle className="size-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Welcome aboard!</h2>
          <p className="text-gray-500">Redirecting...</p>
        </div>
      </div>
    );
  }

  const isProjectInvite = invitation.type === "PROJECT";
  const targetName = isProjectInvite ? invitation.projectName : invitation.workspaceName;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
          {isProjectInvite ? (
            <FolderOpen className="size-8 text-blue-600" />
          ) : (
            <Building2 className="size-8 text-blue-600" />
          )}
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {isProjectInvite ? "Project Invitation" : "Workspace Invitation"}
        </h2>
        <p className="text-gray-600 mb-1">
          <b>{invitation.invitedBy}</b> invited you to join
        </p>
        <p className="text-lg font-semibold text-blue-600 mb-6">{targetName}</p>

        {!isAuthenticated && (
          <p className="text-sm text-gray-500 mb-4">
            You'll need to log in or create an account with <b>{invitation.email}</b> to continue.
          </p>
        )}

        <button
          onClick={handleAccept}
          disabled={accepting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-60"
        >
          {accepting ? "Joining..." : isAuthenticated ? "Accept Invitation" : "Log in to Accept"}
        </button>
      </div>
    </div>
  );
};

export default AcceptInvite;