const express = require('express');
const router = express.Router();
const { addComment, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', addComment);
router.delete('/:id', deleteComment);

module.exports = router;
