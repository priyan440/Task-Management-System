import { configureStore } from '@reduxjs/toolkit';
import taskReducer from './slices/taskSlice';
import workspaceReducer from './slices/workspaceSlice';

const store = configureStore({
  reducer: {
    tasks: taskReducer,
    workspaces: workspaceReducer
  }
});

export default store;
