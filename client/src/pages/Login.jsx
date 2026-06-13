import toast from "react-hot-toast";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useState } from "react";
import { useDispatch } from "react-redux";
import API from "../api/axios";
import { loginSuccess } from "../features/authSlice";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
     const res = await API.post("/api/auth/login", { email, password });
      dispatch(loginSuccess({ token: res.data.token, user: res.data.user }));
      toast.success("Login Successful");
      const redirectTo = location.state?.redirectTo || "/";
      navigate(redirectTo);
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid Credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-500 text-white flex-col justify-center px-16">
        <h1 className="text-5xl font-bold mb-6">ProjectFlow</h1>
        <p className="text-xl text-gray-100 leading-relaxed">
          Manage projects, collaborate with your team, track tasks and boost productivity.
        </p>
        <div className="mt-10 space-y-4">
          {["Project Tracking", "Team Collaboration", "Task Management", "Real-time Updates"].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <span>✅</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Welcome Back 👋</h2>
            <p className="text-gray-500 mt-2">Login to continue managing your projects</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;