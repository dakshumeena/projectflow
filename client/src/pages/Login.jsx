import toast from "react-hot-toast";
import { useNavigate, useLocation, Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import API from "../api/axios";
import { loginSuccess } from "../features/authSlice";
import { ArrowUpRight, Check, LockKeyhole, Mail } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });
      dispatch(loginSuccess({ token: res.data.token, user: res.data.user }));
      toast.success("Login Successful");

      const pendingInviteToken = localStorage.getItem("pendingInviteToken");
      if (pendingInviteToken) {
        localStorage.removeItem("pendingInviteToken");
        navigate(`/invite/${pendingInviteToken}`);
        return;
      }

      const redirectTo = location.state?.redirectTo || searchParams.get("redirectTo") || sessionStorage.getItem("redirectTo") || "/";
      sessionStorage.removeItem("redirectTo");
      navigate(redirectTo);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          (error.response ? "Invalid Credentials" : "Cannot reach the server")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-zinc-950 dark:text-white lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-gradient-to-br from-blue-600 to-blue-500 px-12 py-10 text-white dark:from-zinc-900 dark:to-zinc-800 lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div className="absolute -right-28 -top-28 size-96 rounded-full border-[3rem] border-white/10" />
        <div className="relative flex items-center gap-3 text-sm font-semibold tracking-[0.2em] uppercase"><span className="flex size-9 items-center justify-center rounded-full bg-white/20">P</span>ProjectFlow</div>
        <div className="relative max-w-xl">
          <p className="mb-5 text-xs font-semibold tracking-[0.25em] text-blue-100 uppercase">Your work, in motion</p>
          <h1 className="max-w-lg text-5xl font-semibold leading-[0.98] tracking-tight xl:text-7xl">Make progress visible.</h1>
          <p className="mt-7 max-w-md text-lg leading-8 text-blue-50">A calmer place to plan projects, align people, and move the important work forward.</p>
          <div className="mt-10 grid max-w-md grid-cols-2 gap-x-8 gap-y-4 text-sm text-blue-50">{["Project clarity", "Team alignment", "Focused execution", "Live momentum"].map((item) => <div key={item} className="flex items-center gap-2"><Check className="size-4 text-blue-100" />{item}</div>)}</div>
        </div>
        <p className="relative text-xs text-blue-100">Built for teams that care about the next step.</p>
      </section>

      <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden"><div className="flex items-center gap-3 text-sm font-semibold tracking-[0.2em] uppercase"><span className="flex size-9 items-center justify-center rounded-full bg-blue-600 text-white">P</span>ProjectFlow</div></div>
          <div className="mb-8"><p className="mb-3 text-xs font-semibold tracking-[0.2em] text-gray-500 dark:text-zinc-400 uppercase">Welcome back</p><h2 className="text-4xl font-semibold tracking-tight">Pick up where you left off.</h2><p className="mt-3 text-sm leading-6 text-gray-500 dark:text-zinc-400">Sign in to see your projects, tasks, and team activity.</p></div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div><label htmlFor="login-email" className="mb-2 block text-xs font-semibold tracking-wide text-gray-600 dark:text-zinc-300 uppercase">Email address</label><div className="relative"><Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-400 dark:text-zinc-500" /><input id="login-email" type="email" autoComplete="email" placeholder="you@company.com" className="w-full rounded-lg border border-gray-300 bg-white px-11 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:placeholder:text-zinc-500" value={email} onChange={(e) => setEmail(e.target.value)} required /></div></div>
            <div><label htmlFor="login-password" className="mb-2 block text-xs font-semibold tracking-wide text-gray-600 dark:text-zinc-300 uppercase">Password</label><div className="relative"><LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-400 dark:text-zinc-500" /><input id="login-password" type="password" autoComplete="current-password" placeholder="Enter your password" className="w-full rounded-lg border border-gray-300 bg-white px-11 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:placeholder:text-zinc-500" value={password} onChange={(e) => setPassword(e.target.value)} required /></div></div>
            <button type="submit" disabled={loading} className="group flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Signing in..." : "Sign in"}{!loading && <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}</button>
          </form>
          <p className="mt-8 text-center text-sm text-gray-500 dark:text-zinc-400">New to ProjectFlow? <Link to="/register" className="font-semibold text-blue-600 underline underline-offset-4 hover:text-blue-700 dark:text-blue-400">Create an account</Link></p>
        </div>
      </main>
    </div>
  );
};

export default Login;