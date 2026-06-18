const express = require('express');
const router = express.Router();
const { 
  getTasks, getTask, createTask, updateTask, deleteTask, 
  duplicateTask, bulkUpdateTasks, bulkDeleteTasks, exportCSV 
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Protect all task endpoints
router.use(protect);

router.get('/export/csv', exportCSV);

router.get('/', getTasks);
router.get('/:id', getTask);
router.post('/', createTask);
router.put('/:id', upload.array('attachments', 5), updateTask);
router.delete('/:id', deleteTask);
router.post('/:id/duplicate', duplicateTask);

router.post('/bulk-update', bulkUpdateTasks);
router.post('/bulk-delete', bulkDeleteTasks);

module.exports = router;
