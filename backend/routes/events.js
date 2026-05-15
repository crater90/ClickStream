const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// POST /api/events - Receive and store a new event
router.post('/', async (req, res) => {
  try {
    const {
      session_id,
      event_type,
      page_url,
      timestamp,
      click_x,
      click_y,
      viewport_width,
      viewport_height,
      referrer,
    } = req.body;

    if (!session_id || !event_type || !page_url) {
      return res.status(400).json({
        error: 'Missing required fields: session_id, event_type, page_url',
      });
    }

    if (!['page_view', 'click'].includes(event_type)) {
      return res.status(400).json({
        error: 'Invalid event_type. Must be "page_view" or "click"',
      });
    }

    if (event_type === 'click' && (click_x === undefined || click_y === undefined)) {
      return res.status(400).json({
        error: 'click_x and click_y are required for click events',
      });
    }

    const event = new Event({
      session_id,
      event_type,
      page_url,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      click_x: click_x ?? null,
      click_y: click_y ?? null,
      viewport_width: viewport_width ?? null,
      viewport_height: viewport_height ?? null,
      user_agent: req.headers['user-agent'] || null,
      referrer: referrer || null,
    });

    await event.save();

    res.status(201).json({ success: true, event_id: event._id });
  } catch (err) {
    console.error('Error saving event:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/events/batch - Receive and store multiple events at once
router.post('/batch', async (req, res) => {
  try {
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'events must be a non-empty array' });
    }

    const docs = events.map((e) => ({
      session_id: e.session_id,
      event_type: e.event_type,
      page_url: e.page_url,
      timestamp: e.timestamp ? new Date(e.timestamp) : new Date(),
      click_x: e.click_x ?? null,
      click_y: e.click_y ?? null,
      viewport_width: e.viewport_width ?? null,
      viewport_height: e.viewport_height ?? null,
      user_agent: req.headers['user-agent'] || null,
      referrer: e.referrer || null,
    }));

    const inserted = await Event.insertMany(docs, { ordered: false });
    res.status(201).json({ success: true, inserted: inserted.length });
  } catch (err) {
    console.error('Error saving batch events:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/events/sessions - List all sessions with event counts
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await Event.aggregate([
      {
        $group: {
          _id: '$session_id',
          total_events: { $sum: 1 },
          page_views: {
            $sum: { $cond: [{ $eq: ['$event_type', 'page_view'] }, 1, 0] },
          },
          clicks: {
            $sum: { $cond: [{ $eq: ['$event_type', 'click'] }, 1, 0] },
          },
          first_seen: { $min: '$timestamp' },
          last_seen: { $max: '$timestamp' },
          pages_visited: { $addToSet: '$page_url' },
        },
      },
      {
        $project: {
          session_id: '$_id',
          _id: 0,
          total_events: 1,
          page_views: 1,
          clicks: 1,
          first_seen: 1,
          last_seen: 1,
          pages_visited: { $size: '$pages_visited' },
          duration_seconds: {
            $divide: [
              { $subtract: ['$last_seen', '$first_seen'] },
              1000,
            ],
          },
        },
      },
      { $sort: { last_seen: -1 } },
    ]);

    res.json({ sessions });
  } catch (err) {
    console.error('Error fetching sessions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/events/sessions/:sessionId - Get all events for a specific session
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const events = await Event.find({ session_id: sessionId })
      .sort({ timestamp: 1 })
      .lean();

    if (events.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ session_id: sessionId, events });
  } catch (err) {
    console.error('Error fetching session events:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/events/heatmap?page_url=... - Get click data for a specific page
router.get('/heatmap', async (req, res) => {
  try {
    const { page_url } = req.query;

    if (!page_url) {
      return res.status(400).json({ error: 'page_url query parameter is required' });
    }

    const clicks = await Event.find({
      event_type: 'click',
      page_url: page_url,
    })
      .select('click_x click_y viewport_width viewport_height timestamp session_id -_id')
      .lean();

    // Also return the list of all tracked pages for the dropdown
    const pages = await Event.distinct('page_url');

    res.json({
      page_url,
      total_clicks: clicks.length,
      clicks,
      available_pages: pages,
    });
  } catch (err) {
    console.error('Error fetching heatmap data:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/events/pages - Get list of all tracked pages
router.get('/pages', async (req, res) => {
  try {
    const pages = await Event.aggregate([
      {
        $group: {
          _id: '$page_url',
          total_events: { $sum: 1 },
          total_clicks: {
            $sum: { $cond: [{ $eq: ['$event_type', 'click'] }, 1, 0] },
          },
          total_views: {
            $sum: { $cond: [{ $eq: ['$event_type', 'page_view'] }, 1, 0] },
          },
          last_activity: { $max: '$timestamp' },
        },
      },
      {
        $project: {
          page_url: '$_id',
          _id: 0,
          total_events: 1,
          total_clicks: 1,
          total_views: 1,
          last_activity: 1,
        },
      },
      { $sort: { total_events: -1 } },
    ]);

    res.json({ pages });
  } catch (err) {
    console.error('Error fetching pages:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
