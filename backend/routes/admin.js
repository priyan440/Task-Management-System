const express = require('express');
const router = express.Router();
const { getAdminMetrics, getUsersList, updateUserRole, deleteUserByAdmin } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// Admin restriction middleware combo
router.use(protect);
router.use(authorize('Admin'));

router.get('/dashboard', getAdminMetrics);
router.get('/users', getUsersList);
router.put('/users/:id', updateUserRole);
router.delete('/users/:id', deleteUserByAdmin);

module.exports = router;
