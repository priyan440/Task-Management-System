// Track active user sockets
const onlineUsers = new Map(); // userId -> socketId
const taskViewers = new Map(); // taskId -> Array of { userId, name, avatar }

module.exports = (io) => {
  io.on('connection', (socket) => {
    // console.log(`🔌 Client connected: ${socket.id}`);

    // Register User Presence
    socket.on('register-user', ({ userId, userName, userAvatar }) => {
      if (userId) {
        socket.userId = userId;
        socket.userName = userName;
        socket.userAvatar = userAvatar;
        
        onlineUsers.set(userId, {
          socketId: socket.id,
          name: userName,
          avatar: userAvatar,
          status: 'online'
        });

        // Broadcast updated presence list
        io.emit('online-users-changed', Array.from(onlineUsers.entries()).map(([id, info]) => ({
          userId: id,
          name: info.name,
          avatar: info.avatar
        })));
      }
    });

    // Join Workspace Room
    socket.on('join-workspace', (workspaceId) => {
      if (workspaceId) {
        socket.join(workspaceId);
        // console.log(`👤 Socket ${socket.id} joined Workspace Room: ${workspaceId}`);
      }
    });

    // Leave Workspace Room
    socket.on('leave-workspace', (workspaceId) => {
      if (workspaceId) {
        socket.leave(workspaceId);
        // console.log(`👤 Socket ${socket.id} left Workspace Room: ${workspaceId}`);
      }
    });

    // Collaborative Viewing of a Task Card
    socket.on('view-task', ({ taskId, userId, userName, userAvatar }) => {
      if (!taskId || !userId) return;

      socket.viewingTaskId = taskId;

      if (!taskViewers.has(taskId)) {
        taskViewers.set(taskId, []);
      }

      const viewers = taskViewers.get(taskId);
      if (!viewers.some(v => v.userId === userId)) {
        viewers.push({ userId, name: userName, avatar: userAvatar });
      }

      // Notify viewers list changed
      io.emit(`task-viewers-${taskId}`, viewers);
    });

    // Leave Task Card View
    socket.on('leave-task', ({ taskId, userId }) => {
      if (!taskId || !userId) return;

      socket.viewingTaskId = null;

      if (taskViewers.has(taskId)) {
        let viewers = taskViewers.get(taskId);
        viewers = viewers.filter(v => v.userId !== userId);
        taskViewers.set(taskId, viewers);
        io.emit(`task-viewers-${taskId}`, viewers);
      }
    });

    // Disconnect Action
    socket.on('disconnect', () => {
      // console.log(`🔌 Client disconnected: ${socket.id}`);

      // Handle Task Viewer Clean up
      if (socket.viewingTaskId && socket.userId) {
        const taskId = socket.viewingTaskId;
        if (taskViewers.has(taskId)) {
          let viewers = taskViewers.get(taskId);
          viewers = viewers.filter(v => v.userId !== socket.userId);
          taskViewers.set(taskId, viewers);
          io.emit(`task-viewers-${taskId}`, viewers);
        }
      }

      // Remove from Presence Maps
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit('online-users-changed', Array.from(onlineUsers.entries()).map(([id, info]) => ({
          userId: id,
          name: info.name,
          avatar: info.avatar
        })));
      }
    });
  });
};
