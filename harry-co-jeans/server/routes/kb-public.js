'use strict';

const express = require('express');
const router = express.Router();
const { get, all } = require('../db/database');
const { asyncHandler, HttpError } = require('../middleware/error');

// GET /api/kb — public articles / FAQs
router.get(
  '/',
  asyncHandler((_req, res) => {
    const articles = all(
      "SELECT id, title, slug, category, meta_description as description FROM kb_articles WHERE status = 'published' ORDER BY id ASC"
    );
    res.json({ articles });
  })
);

// GET /api/kb/:slug
router.get(
  '/:slug',
  asyncHandler((req, res) => {
    const article = get(
      "SELECT * FROM kb_articles WHERE slug = ? AND status = 'published'",
      [req.params.slug]
    );
    if (!article) throw new HttpError(404, 'Article not found');
    res.json({ article });
  })
);

module.exports = router;
