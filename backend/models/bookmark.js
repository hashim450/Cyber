const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tool_id: {
    type: Number,
    required: true,
  },
  tool_name: {
    type: String,
  },
  category: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// A user can only bookmark a given tool once
bookmarkSchema.index({ user_id: 1, tool_id: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
