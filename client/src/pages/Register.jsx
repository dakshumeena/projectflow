import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await API.post("/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      toast.success("Registration Successful");

      navigate("/login");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          (error.response ? "Registration failed" : "Cannot reach the server")
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-zinc-950 dark:text-white lg:grid lg:grid-cols-[0.95fr_1.05fr]">
      <section className="relative order-2 hidden min-h-screen overflow-hidden bg-gradient-to-br from-blue-600 to-blue-500 px-12 py-10 text-white dark:from-zinc-900 dark:to-zinc-800 lg:order-1 lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div className="absolute -bottom-24 -left-20 size-80 rounded-full border-[3rem] border-white/10" />
        <div className="relative flex items-center gap-3 text-sm font-semibold tracking-[0.2em] uppercase"><span className="flex size-9 items-center justify-center rounded-full bg-white/20">P</span>ProjectFlow</div>
        <div className="relative max-w-xl">
          <p className="mb-5 text-xs font-semibold tracking-[0.25em] text-blue-100 uppercase">A better starting point</p>
          <h1 className="max-w-lg text-5xl font-semibold leading-[0.98] tracking-tight xl:text-7xl">Turn scattered work into shared momentum.</h1>
          <p className="mt-7 max-w-md text-lg leading-8 text-blue-50">Bring projects, people, and priorities into one clear rhythm from day one.</p>
          <div className="mt-10 space-y-4 text-sm font-semibold text-blue-50">{["Set up your workspace", "Invite the right people", "See what moves next"].map((item, index) => <div key={item} className="flex items-center gap-3"><span className="flex size-7 items-center justify-center rounded-full bg-white/20 text-xs text-white">0{index + 1}</span>{item}</div>)}</div>
        </div>
        <p className="relative text-xs text-blue-100">One focused place for the work that matters.</p>
      </section>

      <main className="order-1 flex min-h-screen items-center justify-center px-5 py-10 sm:px-10 lg:order-2">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden"><div className="flex items-center gap-3 text-sm font-semibold tracking-[0.2em] uppercase"><span className="flex size-9 items-center justify-center rounded-full bg-blue-600 text-white">P</span>ProjectFlow</div></div>
          <div className="mb-7"><p className="mb-3 text-xs font-semibold tracking-[0.2em] text-gray-500 dark:text-zinc-400 uppercase">Start with clarity</p><h2 className="text-4xl font-semibold tracking-tight">Build your team&apos;s next chapter.</h2><p className="mt-3 text-sm leading-6 text-gray-500 dark:text-zinc-400">Create an account and give your work a place to land.</p></div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="register-name" className="mb-2 block text-xs font-semibold tracking-wide text-gray-600 dark:text-zinc-300 uppercase">Full name</label>

              <input
                id="register-name"
                type="text"
                autoComplete="name"
                placeholder="Alex Morgan"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:placeholder:text-zinc-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="register-email" className="mb-2 block text-xs font-semibold tracking-wide text-gray-600 dark:text-zinc-300 uppercase">Work email</label>

              <input
                type="email"
                id="register-email"
                autoComplete="email"
                placeholder="you@company.com"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:placeholder:text-zinc-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="register-password" className="mb-2 block text-xs font-semibold tracking-wide text-gray-600 dark:text-zinc-300 uppercase">Password</label>

              <input
                type="password"
                id="register-password"
                autoComplete="new-password"
                placeholder="Create a secure password"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:placeholder:text-zinc-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="group flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700">
              Create account
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-gray-500 dark:text-zinc-400">Already have an account? <Link to="/login" className="font-semibold text-blue-600 underline underline-offset-4 hover:text-blue-700 dark:text-blue-400">Sign in</Link></p>
        </div>
      </main>
    </div>
  );
};

export default Register;
