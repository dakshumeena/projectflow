import { FcGoogle } from "react-icons/fc";
import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
const navigate = useNavigate();
const handleSubmit = async (e) => {
  e.preventDefault();

  try {
   const res = await API.post("/api/auth/register", {
  name,
  email,
  password,
});

    toast.success("Registration Successful");

    navigate("/login");
  } catch (error) {
    toast.error(
      error.response?.data?.message || "Something went wrong"
    );
  }
};

  const handleGoogleSignup = () => {
    console.log("Google Signup Clicked");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Section */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-500 text-white flex-col justify-center px-16">
        <h1 className="text-5xl font-bold mb-6">
          ProjectFlow
        </h1>

        <p className="text-xl text-gray-100 leading-relaxed">
          Create your workspace, manage projects, assign tasks,
          and collaborate with your team efficiently.
        </p>

        <div className="mt-10 space-y-4">
          <div className="flex items-center gap-3">
            <span>🚀</span>
            <p>Create Unlimited Projects</p>
          </div>

          <div className="flex items-center gap-3">
            <span>👥</span>
            <p>Manage Team Members</p>
          </div>

          <div className="flex items-center gap-3">
            <span>📋</span>
            <p>Track Tasks Easily</p>
          </div>

          <div className="flex items-center gap-3">
            <span>📊</span>
            <p>Monitor Project Progress</p>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex-1 flex items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">
              Create Account ✨
            </h2>

            <p className="text-gray-500 mt-2">
              Start managing your projects today
            </p>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 bg-white py-3 rounded-lg font-medium hover:bg-gray-50 transition duration-200"
          >
           <FcGoogle className="text-xl" />

            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>

            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-sm text-gray-500">
                OR
              </span>
            </div>
          </div>

          {/* Register Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Full Name
              </label>

              <input
                type="text"
                placeholder="Enter your name"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Email
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Password
              </label>

              <input
                type="password"
                placeholder="Create a password"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition"
            >
              Create Account
            </button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-indigo-600 font-semibold hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
