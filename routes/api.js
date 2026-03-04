const express = require('express');
const router = express.Router();
const { Post, User } = require('../models');
const { ensureAuthenticated, canManagePosts } = require('../middleware/auth');

// Get approved posts (public API)
router.get('/posts', async (req, res) => {
  try {
    const posts = await Post.findAll({
      where: { status: 'approved', embedRestricted: false },
      include: [{ model: User, as: 'author', attributes: ['name'] }],
      order: [
        ['isPinned', 'DESC'],
        ['sortOrder', 'ASC'],
        ['createdAt', 'DESC']
      ],
      attributes: ['id', 'title', 'content', 'imageUrl', 'sourceType', 'sourceUrl', 'linkUrl', 'isPinned', 'createdAt']
    });

    res.json({ success: true, posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Error loading posts' });
  }
});

// Update post order (drag and drop)
router.post('/posts/reorder', canManagePosts, async (req, res) => {
  try {
    const { order } = req.body; // Array of { id, sortOrder }
    
    if (!Array.isArray(order)) {
      return res.status(400).json({ success: false, error: 'Invalid order data' });
    }

    // Update each post's sort order
    await Promise.all(
      order.map(item => 
        Post.update(
          { sortOrder: item.sortOrder },
          { where: { id: item.id } }
        )
      )
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Error updating order' });
  }
});

// Quick status update
router.post('/posts/:id/status', canManagePosts, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    if (status === 'approved') {
      const post = await Post.findByPk(req.params.id);
      if (post && post.embedRestricted) {
        return res.status(400).json({ success: false, error: 'Cannot approve a post with embed restrictions' });
      }
    }

    await Post.update(
      { 
        status,
        reviewerId: req.user.id,
        reviewedAt: new Date()
      },
      { where: { id: req.params.id } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Error updating status' });
  }
});

// Toggle pin
router.post('/posts/:id/pin', canManagePosts, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    await post.update({ isPinned: !post.isPinned });
    res.json({ success: true, isPinned: post.isPinned });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Error toggling pin' });
  }
});

// Randomize post order
router.post("/posts/randomize", canManagePosts, async (req, res) => {
  try {
    const posts = await Post.findAll({
      where: { isPinned: false },
      attributes: ["id"]
    });

    // Fisher-Yates shuffle
    const ids = posts.map(p => p.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }

    await Promise.all(
      ids.map((id, index) =>
        Post.update({ sortOrder: index }, { where: { id } })
      )
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Error randomizing order" });
  }
});
module.exports = router;
