const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  session_id: {
    type: String,
    required: true,
    index: true,
  },
  event_type: {
    type: String,
    required: true,
    enum: ['page_view', 'click'],
    index: true,
  },
  page_url: {
    type: String,
    required: true,
    index: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
  // Click-specific fields
  click_x: {
    type: Number,
    default: null,
  },
  click_y: {
    type: Number,
    default: null,
  },
  // Viewport dimensions for normalizing click positions
  viewport_width: {
    type: Number,
    default: null,
  },
  viewport_height: {
    type: Number,
    default: null,
  },
  // Optional metadata
  user_agent: {
    type: String,
    default: null,
  },
  referrer: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

// Compound index for heatmap queries
eventSchema.index({ page_url: 1, event_type: 1 });
// Compound index for session journey queries
eventSchema.index({ session_id: 1, timestamp: 1 });

module.exports = mongoose.model('Event', eventSchema);
