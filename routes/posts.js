const express = require('express');
const router = express.Router();
const { Post, User } = require('../models');
const { ensureAuthenticated, canManagePosts } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { csrfValidate } = require('../middleware/csrf');

// Check if a YouTube video allows embedding via oEmbed
async function checkYouTubeEmbeddable(videoId) {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&format=json`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    return response.ok;
  } catch (err) {
    console.error('YouTube embed check failed:', err.message);
    return true; // Allow on network errors so we don't block legitimate posts
  }
}

// Multer error handler wrapper
const handleUpload = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      req.flash('error_msg', `Upload error: ${err.message}`);
      return res.redirect('back');
    }
    next();
  });
};

// Create post form
router.get('/create', ensureAuthenticated, (req, res) => {
  res.render('posts/create', { 
    title: 'Create Post',
    isManager: ['editor', 'admin'].includes(req.user.role)
  });
});

// Create post handler
router.post("/create", ensureAuthenticated, handleUpload, csrfValidate, async (req, res) => {
  try {
    const { title, content, sourceType, sourceUrl, linkUrl } = req.body;
    const isManager = ['editor', 'admin'].includes(req.user.role);
    
    // Determine initial status
    const status = isManager ? 'approved' : 'pending';
    
    // New posts get the lowest sortOrder so they appear first (sorted ASC)
    const minOrder = await Post.min('sortOrder') ?? 0;
    
    const postData = {
      title,
      content,
      sourceType: sourceType || 'original',
      sourceUrl: sourceUrl || null,
      linkUrl: linkUrl || null,
      status,
      sortOrder: minOrder - 1,
      authorId: req.user.id
    };

    // Handle social media imports first (for YouTube thumbnail)
    if (sourceType && sourceType !== 'original' && sourceUrl) {
      const embedData = generateEmbedData(sourceType, sourceUrl);
      postData.sourceId = embedData.sourceId;
      postData.embedHtml = embedData.embedHtml;
      // For YouTube, always use the auto-generated thumbnail
      if (sourceType === 'youtube' && embedData.imageUrl) {
        postData.imageUrl = embedData.imageUrl;
      } else if (embedData.imageUrl && !req.file) {
        postData.imageUrl = embedData.imageUrl;
      }
    }

    // Handle image upload (not for YouTube - use auto thumbnail)
    if (req.file && sourceType !== 'youtube') {
      postData.imageUrl = await upload.toDataUrl(req.file);
    }

    // Check YouTube embeddability before saving
    if (sourceType === 'youtube' && postData.sourceId) {
      const embeddable = await checkYouTubeEmbeddable(postData.sourceId);
      if (!embeddable) {
        postData.embedRestricted = true;
        postData.status = 'rejected';
      }
    }

    await Post.create(postData);
    
    if (postData.embedRestricted) {
      req.flash('error_msg', 'This YouTube video does not allow embedding and has been flagged as restricted.');
    } else {
      req.flash('success_msg', status === 'approved' 
        ? 'Post created and published!' 
        : 'Post created and submitted for review');
    }
    res.redirect('/admin');
  } catch (err) {
    console.error('Error creating post:', err);
    req.flash('error_msg', `Error creating post: ${err.message}`);
    res.redirect('/posts/create');
  }
});

// Edit post form
router.get('/:id/edit', ensureAuthenticated, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    
    if (!post) {
      req.flash('error_msg', 'Post not found');
      return res.redirect('/admin');
    }

    // Check permission
    const isManager = ['editor', 'admin'].includes(req.user.role);
    if (!isManager && post.authorId !== req.user.id) {
      req.flash('error_msg', 'Not authorized');
      return res.redirect('/admin');
    }

    res.render('posts/edit', { 
      title: 'Edit Post',
      post,
      isManager
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading post');
    res.redirect('/admin');
  }
});

// Update post handler
router.post("/:id/edit", ensureAuthenticated, handleUpload, csrfValidate, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    
    if (!post) {
      req.flash('error_msg', 'Post not found');
      return res.redirect('/admin');
    }

    const isManager = ['editor', 'admin'].includes(req.user.role);
    if (!isManager && post.authorId !== req.user.id) {
      req.flash('error_msg', 'Not authorized');
      return res.redirect('/admin');
    }

    const { title, content, sourceType, sourceUrl, linkUrl } = req.body;
    
    const updateData = {
      title,
      content,
      sourceType: sourceType || 'original',
      sourceUrl: sourceUrl || null,
      linkUrl: linkUrl || null
    };

    // Handle image upload
    if (req.file) {
      updateData.imageUrl = await upload.toDataUrl(req.file);
    }

    // Handle social media imports
    if (sourceType && sourceType !== 'original' && sourceUrl) {
      const embedData = generateEmbedData(sourceType, sourceUrl);
      updateData.sourceId = embedData.sourceId;
      updateData.embedHtml = embedData.embedHtml;
    }

    // Re-check YouTube embeddability if URL changed
    if (sourceType === 'youtube' && updateData.sourceId) {
      const embeddable = await checkYouTubeEmbeddable(updateData.sourceId);
      updateData.embedRestricted = !embeddable;
      if (!embeddable) {
        updateData.status = 'rejected';
      }
    } else if (sourceType !== 'youtube') {
      updateData.embedRestricted = false;
    }

    // If non-manager edits, reset to pending
    if (!isManager && !updateData.embedRestricted) {
      updateData.status = 'pending';
    }

    await post.update(updateData);
    
    if (updateData.embedRestricted) {
      req.flash('error_msg', 'This YouTube video does not allow embedding and has been flagged as restricted.');
    } else {
      req.flash('success_msg', 'Post updated');
    }
    res.redirect('/admin');
  } catch (err) {
    console.error('Error updating post:', err);
    req.flash('error_msg', `Error updating post: ${err.message}`);
    res.redirect('/admin');
  }
});

// Approve post
router.post('/:id/approve', canManagePosts, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (post && post.embedRestricted) {
      req.flash('error_msg', 'Cannot approve: this post has an embed restriction. The source video does not allow embedding.');
      return res.redirect('back');
    }

    await Post.update(
      { 
        status: 'approved',
        reviewerId: req.user.id,
        reviewedAt: new Date()
      },
      { where: { id: req.params.id } }
    );
    req.flash('success_msg', 'Post approved');
    res.redirect('back');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error approving post');
    res.redirect('/admin');
  }
});

// Reject post
router.post('/:id/reject', canManagePosts, async (req, res) => {
  try {
    await Post.update(
      { 
        status: 'rejected',
        reviewerId: req.user.id,
        reviewedAt: new Date()
      },
      { where: { id: req.params.id } }
    );
    req.flash('success_msg', 'Post rejected');
    res.redirect('back');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error rejecting post');
    res.redirect('/admin');
  }
});

// Toggle pin
router.post('/:id/pin', canManagePosts, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (post) {
      await post.update({ isPinned: !post.isPinned });
    }
    res.redirect('back');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error toggling pin');
    res.redirect('/admin');
  }
});

// Delete post
router.post('/:id/delete', canManagePosts, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    
    if (post) {
      await post.destroy();
    }
    
    req.flash('success_msg', 'Post deleted');
    res.redirect('/admin');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting post');
    res.redirect('/admin');
  }
});

// Helper function to generate embed data
function generateEmbedData(sourceType, sourceUrl) {
  const data = { sourceId: null, embedHtml: null, imageUrl: null };
  
  try {
    const url = new URL(sourceUrl);
    
    switch (sourceType) {
      case 'youtube':
        // Extract video ID from various YouTube URL formats
        let videoId = null;
        if (url.hostname.includes('youtube.com')) {
          videoId = url.searchParams.get('v');
        } else if (url.hostname.includes('youtu.be')) {
          videoId = url.pathname.slice(1);
        }
        if (videoId) {
          data.sourceId = videoId;
          data.imageUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          data.embedHtml = `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
        }
        break;
        
      case 'twitter':
        // Extract tweet ID
        const tweetMatch = url.pathname.match(/status\/(\d+)/);
        if (tweetMatch) {
          data.sourceId = tweetMatch[1];
          data.embedHtml = `<blockquote class="twitter-tweet" data-conversation="none"><a href="${sourceUrl}"></a></blockquote>`;
        }
        break;
        
      case 'instagram':
        // Extract post ID
        const instaMatch = url.pathname.match(/\/p\/([A-Za-z0-9_-]+)/);
        if (instaMatch) {
          data.sourceId = instaMatch[1];
          data.embedHtml = `<blockquote class="instagram-media" data-instgrm-permalink="${sourceUrl}"></blockquote>`;
        }
        break;
    }
  } catch (e) {
    console.error('Error parsing source URL:', e);
  }
  
  return data;
}

module.exports = router;
