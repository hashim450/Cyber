const Bookmark = require('../models/bookmark');

// Tool name + category lookup (kept in sync with the 21 API catalog)
const TOOL_INFO = {
  1:  { name: 'AbuseIPDB',            category: 'IP Intelligence' },
  2:  { name: 'VirusTotal',           category: 'Malware Analysis' },
  3:  { name: 'Have I Been Pwned',    category: 'Breach Detection' },
  4:  { name: 'IPinfo',               category: 'IP Intelligence' },
  5:  { name: 'Shodan',               category: 'Threat Detection' },
  6:  { name: 'SecurityTrails',       category: 'DNS Analysis' },
  7:  { name: 'WhoisXML / RDAP',      category: 'WHOIS Lookup' },
  8:  { name: 'GreyNoise',            category: 'Threat Detection' },
  9:  { name: 'URLScan',              category: 'URL Scanning' },
  10: { name: 'Hunter.io',            category: 'Email Intelligence' },
  11: { name: 'BuiltWith',            category: 'Threat Detection' },
  12: { name: 'Censys / InternetDB',  category: 'IP Intelligence' },
  13: { name: 'OpenPhish',            category: 'URL Scanning' },
  14: { name: 'AlienVault OTX',       category: 'Threat Detection' },
  15: { name: 'NVD API',              category: 'Vulnerability' },
  16: { name: 'IPAPI',                category: 'Geolocation' },
  17: { name: 'EmailRep',             category: 'Email Intelligence' },
  18: { name: 'DNS Lookup',           category: 'DNS Analysis' },
  19: { name: 'Google Safe Browsing', category: 'URL Scanning' },
  20: { name: 'CVE Details',          category: 'Vulnerability' },
};

// ─── GET all bookmarks for the logged-in user ────────────────────────────────
const getBookmarks = async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user_id: req.user._id })
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      count: bookmarks.length,
      // Plain array of tool_ids — easiest shape for the frontend to check against
      toolIds: bookmarks.map(b => b.tool_id),
      bookmarks,
    });
  } catch (err) {
    console.error('[BOOKMARK] Fetch error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch bookmarks.' });
  }
};

// ─── ADD a bookmark ───────────────────────────────────────────────────────────
const addBookmark = async (req, res) => {
  try {
    const { tool_id } = req.body;
    if (!tool_id) {
      return res.status(400).json({ success: false, message: 'tool_id is required.' });
    }

    const info = TOOL_INFO[tool_id] || {};

    // Upsert-style: ignore if already bookmarked (unique index also guards this)
    const existing = await Bookmark.findOne({ user_id: req.user._id, tool_id: Number(tool_id) });
    if (existing) {
      return res.status(200).json({ success: true, message: 'Already bookmarked.', bookmark: existing });
    }

    const bookmark = await Bookmark.create({
      user_id: req.user._id,
      tool_id: Number(tool_id),
      tool_name: info.name || 'Unknown',
      category: info.category || 'Unknown',
    });

    res.status(201).json({ success: true, message: 'Bookmark added.', bookmark });
  } catch (err) {
    // Duplicate key race (two rapid clicks) — treat as success, not an error
    if (err.code === 11000) {
      return res.status(200).json({ success: true, message: 'Already bookmarked.' });
    }
    console.error('[BOOKMARK] Add error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to add bookmark.' });
  }
};

// ─── REMOVE a single bookmark ─────────────────────────────────────────────────
const removeBookmark = async (req, res) => {
  try {
    const toolId = Number(req.params.toolId);
    if (!toolId) {
      return res.status(400).json({ success: false, message: 'A valid toolId is required.' });
    }

    const result = await Bookmark.findOneAndDelete({ user_id: req.user._id, tool_id: toolId });

    if (!result) {
      return res.status(404).json({ success: false, message: 'Bookmark not found.' });
    }

    res.status(200).json({ success: true, message: 'Bookmark removed.' });
  } catch (err) {
    console.error('[BOOKMARK] Remove error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to remove bookmark.' });
  }
};

// ─── TOGGLE a bookmark (add if missing, remove if present) ───────────────────
// Lets the frontend call one endpoint without first checking state.
const toggleBookmark = async (req, res) => {
  try {
    const { tool_id } = req.body;
    if (!tool_id) {
      return res.status(400).json({ success: false, message: 'tool_id is required.' });
    }
    const toolId = Number(tool_id);

    const existing = await Bookmark.findOne({ user_id: req.user._id, tool_id: toolId });

    if (existing) {
      await Bookmark.deleteOne({ _id: existing._id });
      return res.status(200).json({ success: true, action: 'removed', tool_id: toolId });
    }

    const info = TOOL_INFO[toolId] || {};
    const bookmark = await Bookmark.create({
      user_id: req.user._id,
      tool_id: toolId,
      tool_name: info.name || 'Unknown',
      category: info.category || 'Unknown',
    });

    res.status(201).json({ success: true, action: 'added', tool_id: toolId, bookmark });
  } catch (err) {
    if (err.code === 11000) {
      // Lost a race with another request — treat as already added
      return res.status(200).json({ success: true, action: 'added', tool_id: Number(req.body.tool_id) });
    }
    console.error('[BOOKMARK] Toggle error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to toggle bookmark.' });
  }
};

// ─── CLEAR all bookmarks for the user ─────────────────────────────────────────
const clearBookmarks = async (req, res) => {
  try {
    await Bookmark.deleteMany({ user_id: req.user._id });
    res.status(200).json({ success: true, message: 'All bookmarks cleared.' });
  } catch (err) {
    console.error('[BOOKMARK] Clear error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to clear bookmarks.' });
  }
};

module.exports = {
  getBookmarks,
  addBookmark,
  removeBookmark,
  toggleBookmark,
  clearBookmarks,
};
