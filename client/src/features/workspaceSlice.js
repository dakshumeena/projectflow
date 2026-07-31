import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  workspaces: [],
  currentWorkspace: null,
  loading: false,
};

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setWorkspaces: (state, action) => {
      state.workspaces = action.payload;
      const savedId = localStorage.getItem("currentWorkspaceId");
      if (savedId) {
        const found = action.payload.find((w) => w._id === savedId);
        state.currentWorkspace = found || action.payload[0] || null;
      } else {
        state.currentWorkspace = action.payload[0] || null;
      }
      if (state.currentWorkspace) {
        localStorage.setItem("currentWorkspaceId", state.currentWorkspace._id);
      }
    },

    setCurrentWorkspace: (state, action) => {
      const found = state.workspaces.find((w) => w._id === action.payload);
      if (found) {
        state.currentWorkspace = found;
        localStorage.setItem("currentWorkspaceId", action.payload);
      }
    },

  addWorkspace: (state, action) => {
  const newWorkspace = {
    ...action.payload,
    projects: action.payload.projects || [],
    members: action.payload.members || [],
  };
  state.workspaces.unshift(newWorkspace);
  state.currentWorkspace = newWorkspace;
  localStorage.setItem("currentWorkspaceId", newWorkspace._id);
},

    updateWorkspace: (state, action) => {
      state.workspaces = state.workspaces.map((w) =>
        w._id === action.payload._id ? action.payload : w
      );
      if (state.currentWorkspace?._id === action.payload._id) {
        state.currentWorkspace = action.payload;
      }
    },

    deleteWorkspace: (state, action) => {
      state.workspaces = state.workspaces.filter((w) => w._id !== action.payload);
      if (state.currentWorkspace?._id === action.payload) {
        state.currentWorkspace = state.workspaces[0] || null;
        if (state.currentWorkspace) {
          localStorage.setItem("currentWorkspaceId", state.currentWorkspace._id);
        } else {
          localStorage.removeItem("currentWorkspaceId");
        }
      }
    },

    // Called after creating a project so sidebar updates instantly
    addProjectToWorkspace: (state, action) => {
      if (state.currentWorkspace) {
        state.currentWorkspace.projects = [
          action.payload,
          ...(state.currentWorkspace.projects || []),
        ];
        state.workspaces = state.workspaces.map((w) =>
          w._id === state.currentWorkspace._id ? state.currentWorkspace : w
        );
      }
    },

    updateProjectInWorkspace: (state, action) => {
      if (state.currentWorkspace) {
        state.currentWorkspace.projects = state.currentWorkspace.projects.map((p) =>
          p._id === action.payload._id ? action.payload : p
        );
        state.workspaces = state.workspaces.map((w) =>
          w._id === state.currentWorkspace._id ? state.currentWorkspace : w
        );
      }
    },
    removeProjectFromWorkspace: (state, action) => {
  if (state.currentWorkspace) {
    state.currentWorkspace.projects =
      state.currentWorkspace.projects.filter(
        (p) => p._id !== action.payload
      );

    state.workspaces = state.workspaces.map((w) =>
      w._id === state.currentWorkspace._id
        ? state.currentWorkspace
        : w
    );
  }
},
  },
});

export const {
  setLoading,
  setWorkspaces,
  setCurrentWorkspace,
  addWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addProjectToWorkspace,
  updateProjectInWorkspace,
  removeProjectFromWorkspace,
} = workspaceSlice.actions;

export default workspaceSlice.reducer;