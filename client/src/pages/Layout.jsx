// Layout.jsx
import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { Outlet } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { loadTheme } from '../features/themeSlice'
import { setWorkspaces } from '../features/workspaceSlice'
import { getWorkspaces } from '../api/workspaceApi'

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(loadTheme())
    }, [])

    useEffect(() => {
        if (!localStorage.getItem("token")) {
            dispatch(setWorkspaces([]));
            return undefined;
        }

        const fetchWorkspaces = async () => {
            try {
                const data = await getWorkspaces();
                dispatch(setWorkspaces(data.workspaces));
            } catch (error) {
                console.error(error);
            }
        };
        fetchWorkspaces();

        const refreshOnFocus = () => fetchWorkspaces();
        const refreshInterval = window.setInterval(fetchWorkspaces, 5000);
        window.addEventListener('focus', refreshOnFocus);

        return () => {
            window.clearInterval(refreshInterval);
            window.removeEventListener('focus', refreshOnFocus);
        };
    }, [])

    return (
        <div className="flex bg-white dark:bg-zinc-950 text-gray-900 dark:text-slate-100">
            <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            <div className="flex-1 flex flex-col h-screen">
                <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
                <div className="flex-1 h-full p-6 xl:p-10 xl:px-16 overflow-y-scroll">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}

export default Layout