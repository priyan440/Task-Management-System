import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/client';
import toast from 'react-hot-toast';

// Async Thunks
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async ({ workspaceId, search, status, priority, category, sortBy }, { rejectWithValue }) => {
    try {
      const response = await API.get('/tasks', {
        params: { workspaceId, search, status, priority, category, sortBy }
      });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch tasks');
    }
  }
);

export const fetchTaskDetails = createAsyncThunk(
  'tasks/fetchTaskDetails',
  async (id, { rejectWithValue }) => {
    try {
      const response = await API.get(`/tasks/${id}`);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load task details');
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData, { rejectWithValue }) => {
    try {
      const response = await API.post('/tasks', taskData);
      toast.success('Task created successfully');
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create task');
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, fields }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/tasks/${id}`, fields);
      // Optional: check if multipart/form-data handles
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update task');
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (id, { rejectWithValue }) => {
    try {
      const response = await API.delete(`/tasks/${id}`);
      toast.success('Task deleted successfully');
      return { id, deletedTask: response.data.data }; // Send deleted task for Undo support
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete task');
    }
  }
);

export const duplicateTask = createAsyncThunk(
  'tasks/duplicateTask',
  async (id, { rejectWithValue }) => {
    try {
      const response = await API.post(`/tasks/${id}/duplicate`);
      toast.success('Task duplicated');
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to duplicate task');
    }
  }
);

export const bulkUpdateTasks = createAsyncThunk(
  'tasks/bulkUpdateTasks',
  async ({ taskIds, updates, workspaceId }, { dispatch, rejectWithValue }) => {
    try {
      await API.post('/tasks/bulk-update', { taskIds, updates, workspaceId });
      toast.success(`Updated ${taskIds.length} tasks`);
      dispatch(fetchTasks({ workspaceId }));
      return { success: true };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Bulk update failed');
    }
  }
);

export const bulkDeleteTasks = createAsyncThunk(
  'tasks/bulkDeleteTasks',
  async ({ taskIds, workspaceId }, { dispatch, rejectWithValue }) => {
    try {
      await API.post('/tasks/bulk-delete', { taskIds, workspaceId });
      toast.success(`Deleted ${taskIds.length} tasks`);
      dispatch(fetchTasks({ workspaceId }));
      return { success: true };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Bulk delete failed');
    }
  }
);

const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    items: [],
    activeTask: null,
    loading: false,
    error: null,
    undoStack: [], // Undo delete cache
    filters: {
      search: '',
      priority: '',
      category: '',
      status: ''
    }
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = { search: '', priority: '', category: '', status: '' };
    },
    // WebSocket sync actions
    wsTaskCreated: (state, action) => {
      const exists = state.items.some(t => t._id === action.payload._id);
      if (!exists) {
        state.items.unshift(action.payload);
      }
    },
    wsTaskUpdated: (state, action) => {
      const index = state.items.findIndex(t => t._id === action.payload._id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
      if (state.activeTask && state.activeTask._id === action.payload._id) {
        state.activeTask = action.payload;
      }
    },
    wsTaskDeleted: (state, action) => {
      state.items = state.items.filter(t => t._id !== action.payload.id);
      if (state.activeTask && state.activeTask._id === action.payload.id) {
        state.activeTask = null;
      }
    },
    pushUndoTask: (state, action) => {
      state.undoStack.push(action.payload);
    },
    popUndoTask: (state) => {
      state.undoStack.pop();
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Tasks
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Task details
      .addCase(fetchTaskDetails.fulfilled, (state, action) => {
        state.activeTask = action.payload;
      })
      // Create Task
      .addCase(createTask.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      // Update Task
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.items.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.activeTask && state.activeTask._id === action.payload._id) {
          state.activeTask = action.payload;
        }
      })
      // Delete Task
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.items = state.items.filter(t => t._id !== action.payload.id);
        if (action.payload.deletedTask) {
          state.undoStack.push(action.payload.deletedTask);
        }
        if (state.activeTask && state.activeTask._id === action.payload.id) {
          state.activeTask = null;
        }
      })
      // Duplicate Task
      .addCase(duplicateTask.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      });
  }
});

export const { 
  setFilters, clearFilters, wsTaskCreated, wsTaskUpdated, wsTaskDeleted, pushUndoTask, popUndoTask 
} = taskSlice.actions;

export default taskSlice.reducer;
