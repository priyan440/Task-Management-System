import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/client';
import toast from 'react-hot-toast';

// Async Thunks
export const fetchWorkspaces = createAsyncThunk(
  'workspaces/fetchWorkspaces',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/workspaces');
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch workspaces');
    }
  }
);

export const createWorkspace = createAsyncThunk(
  'workspaces/createWorkspace',
  async ({ name, icon }, { rejectWithValue }) => {
    try {
      const response = await API.post('/workspaces', { name, icon });
      toast.success('Workspace created successfully!');
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create workspace');
    }
  }
);

export const fetchWorkspaceMembers = createAsyncThunk(
  'workspaces/fetchWorkspaceMembers',
  async (workspaceId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/workspaces/${workspaceId}/members`);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch workspace members');
    }
  }
);

export const inviteUserToWorkspace = createAsyncThunk(
  'workspaces/inviteUserToWorkspace',
  async ({ workspaceId, email, role }, { rejectWithValue }) => {
    try {
      const response = await API.post(`/workspaces/${workspaceId}/invite`, { email, role });
      toast.success('Member invited successfully!');
      return response.data.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Invitation failed';
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const removeWorkspaceMember = createAsyncThunk(
  'workspaces/removeWorkspaceMember',
  async ({ workspaceId, userId }, { rejectWithValue }) => {
    try {
      await API.delete(`/workspaces/${workspaceId}/members/${userId}`);
      toast.success('Member removed');
      return userId;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to remove member';
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

const workspaceSlice = createSlice({
  name: 'workspaces',
  initialState: {
    items: [],
    members: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Workspaces
      .addCase(fetchWorkspaces.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Workspace
      .addCase(createWorkspace.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      // Fetch Workspace Members
      .addCase(fetchWorkspaceMembers.fulfilled, (state, action) => {
        state.members = action.payload;
      })
      // Remove Member
      .addCase(removeWorkspaceMember.fulfilled, (state, action) => {
        state.members = state.members.filter(m => String(m.user?._id || m.user) !== String(action.payload));
      });
  }
});

export default workspaceSlice.reducer;
