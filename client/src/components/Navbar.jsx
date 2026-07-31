import { SearchIcon, PanelLeft, Mail, LogOut, ChevronDown } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleTheme } from '../features/themeSlice'
import { logout } from '../features/authSlice'
import { MoonIcon, SunIcon } from 'lucide-react'
import { assets } from '../assets/assets'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { NotificationBell } from "./NotificationsPanel";

const Navbar = ({ setIsSidebarOpen }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { theme } = useSelector(state => state.theme);
    const { user } = useSelector(state => state.auth);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    // Get initials for avatar fallback
    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : 'U';

    return (
        <div className="w-full bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 xl:px-16 py-3 flex-shrink-0">
            <div className="flex items-center justify-between max-w-6xl mx-auto">
                {/* Left section */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Sidebar Trigger */}
                    <button
                        onClick={() => setIsSidebarOpen((prev) => !prev)}
                        className="sm:hidden p-2 rounded-lg transition-colors text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800"
                    >
                        <PanelLeft size={20} />
                    </button>

                    {/* Search Input */}
                    <div className="relative flex-1 max-w-sm">
                        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-400 size-3.5" />
                        <input
                            type="text"
                            placeholder="Search projects, tasks..."
                            className="pl-8 pr-4 py-2 w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-md text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                    </div>
                </div>

                {/* Right section */}
                <div className="flex items-center gap-3">
                    <NotificationBell />
                    {/* Theme Toggle */}
                    <button
                        onClick={() => dispatch(toggleTheme())}
                        className="size-8 flex items-center justify-center bg-white dark:bg-zinc-800 shadow rounded-lg transition hover:scale-105 active:scale-95"
                    >
                        {theme === "light"
                            ? <MoonIcon className="size-4 text-gray-800" />
                            : <SunIcon className="size-4 text-yellow-400" />
                        }
                    </button>

                    {/* User Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(prev => !prev)}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
                        >
                            {/* Avatar */}
                            <div className="size-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                                {user?.image
                                    ? <img src={user.image} alt="avatar" className="size-full object-cover" />
                                    : initials
                                }
                            </div>
                            {/* Name — hidden on small screens */}
                            <span className="hidden sm:block text-sm font-medium text-gray-800 dark:text-white max-w-28 truncate">
                                {user?.name || 'User'}
                            </span>
                            <ChevronDown className="size-3.5 text-gray-500 dark:text-zinc-400 hidden sm:block" />
                        </button>

                        {dropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-lg z-50 overflow-hidden">
                                {/* User info header */}
                                <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                        {user?.name || 'User'}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <Mail className="size-3 text-gray-400 dark:text-zinc-500 flex-shrink-0" />
                                        <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                                            {user?.email || ''}
                                        </p>
                                    </div>
                                </div>

                                {/* Logout */}
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                                >
                                    <LogOut className="size-4" />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Navbar