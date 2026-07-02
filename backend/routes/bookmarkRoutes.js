const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getBookmarks,
  addBookmark,
  removeBookmark,
  toggleBookmark,
  clearBookmarks,
} = require('../controllers/bookmarkController');

// All bookmark routes are protected — user must be authenticated
router.use(protect);

router.get('/',             getBookmarks);     // Get all bookmarks for current user
router.post('/',            addBookmark);      // Add a bookmark
router.post('/toggle',      toggleBookmark);   // Toggle add/remove in one call
router.delete('/:toolId',   removeBookmark);   // Remove a single bookmark by tool_id
router.delete('/',          clearBookmarks);   // Clear all bookmarks

module.exports = router;
