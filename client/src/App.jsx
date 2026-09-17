import { Routes, Route } from "react-router-dom";
import Layout from "./pages/Layout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Team from "./pages/Team";
import ProjectDetails from "./pages/ProjectDetails";
import TaskDetails from "./pages/TaskDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AcceptInvite from "./pages/AcceptInvite";
import Settings from "./pages/Settings";


const App = () => {
    return (
        <Routes>
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/invite/:token" element={<AcceptInvite />} />

            <Route
                path="/"
                element={<Layout />}
            >
                <Route index          element={<Dashboard />} />
                <Route path="team"    element={<Team />} />
                <Route path="projects" element={<Projects />} />
                <Route path="projectsDetail" element={<ProjectDetails />} />
                <Route path="taskDetails"    element={<TaskDetails />} />
                <Route path="settings"       element={<Settings />} />
            </Route>
        </Routes>
    );
};

export default App;