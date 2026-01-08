# UN Social Feed

A modern content management system for creating and curating social media posts with a masonry layout that can be embedded on any website without external scripts. Built with the United Nations blue color scheme.

## Features

### Content Management
- **Create Posts**: Title, image upload, and WYSIWYG rich text editor
- **Social Media Import**: Pull in content from Instagram, Twitter/X, and YouTube
- **Status Management**: Pending, Approved, and Rejected states with visual indicators
- **Drag & Drop Reordering**: Easily reorder posts in the dashboard
- **Pin Posts**: Pin important posts to the top of the feed

### User Roles
- **User**: Can only create posts (submitted for review)
- **Editor**: Can create posts and approve/reject/delete posts
- **Admin**: All editor permissions plus user role management

### Embeddable Feed
- **Masonry Layout**: Beautiful responsive grid layout
- **No External Scripts**: Works on sites that block external JavaScript
- **iframe-based**: Simple copy-paste embed code

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Views**: EJS templates
- **Styling**: Bootstrap 5, Open Sans font, UN blue accent color
- **WYSIWYG**: Quill editor
- **Drag & Drop**: SortableJS

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd social-feed-app
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```
DATABASE_URL=postgresql://user:password@localhost:5432/social_feed
SESSION_SECRET=your-super-secret-session-key
PORT=3000
NODE_ENV=development
```

5. Run database migrations:
```bash
npm run db:migrate
```

6. (Optional) Seed with sample data:
```bash
npm run db:seed
```

7. Start the server:
```bash
npm start
```

8. Visit `http://localhost:3000`

### Default Admin Credentials (after seeding)
- **Email**: admin@example.com
- **Password**: admin123

## Deployment on Railway

### Quick Deploy

1. Push your code to GitHub

2. Create a new project on [Railway](https://railway.app)

3. Add a PostgreSQL database:
   - Click "New Service" → "Database" → "PostgreSQL"

4. Deploy from GitHub:
   - Click "New Service" → "GitHub Repo" → Select your repository

5. Set environment variables in Railway:
   - `SESSION_SECRET`: Generate a secure random string
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: Railway auto-provisions this from the Postgres service

6. Railway will automatically:
   - Detect Node.js and install dependencies
   - Run the start command
   - Set up SSL for the database connection

### Manual Configuration

The `railway.json` file is included with optimal settings:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/"
  }
}
```

## Embedding the Feed

Navigate to **Embed Code** in the admin sidebar to get your embed code:

```html
<iframe 
  src="https://your-app.railway.app/embed" 
  style="width:100%;min-height:600px;border:none;" 
  title="Social Feed">
</iframe>
```

The embed uses:
- Pure CSS masonry (no JavaScript required)
- Self-contained styles
- Responsive design (1-3 columns based on width)

## API Endpoints

### Public
- `GET /api/posts` - Get all approved posts
- `GET /embed` - Embeddable feed HTML

### Authenticated
- `POST /api/posts/reorder` - Reorder posts (Editor/Admin)
- `POST /api/posts/:id/status` - Update post status (Editor/Admin)
- `POST /api/posts/:id/pin` - Toggle pin (Editor/Admin)

## Color Scheme

| Element | Color |
|---------|-------|
| Links/Accents | UN Blue `#009EDB` |
| Pending Status | Amber `#F0AD4E` |
| Approved Status | Green `#28A745` |
| Rejected Status | Red `#DC3545` |
| Borders | Light Gray `#E5E5E5` |

## Project Structure

```
social-feed-app/
├── config/
│   ├── database.js      # Sequelize configuration
│   └── passport.js      # Authentication strategy
├── middleware/
│   ├── auth.js          # Role-based access control
│   └── upload.js        # File upload handling
├── models/
│   └── index.js         # User and Post models
├── routes/
│   ├── admin.js         # Dashboard and user management
│   ├── api.js           # JSON API endpoints
│   ├── auth.js          # Login/register/logout
│   ├── embed.js         # Embeddable feed
│   ├── index.js         # Home redirect
│   └── posts.js         # Post CRUD operations
├── scripts/
│   ├── migrate.js       # Database migrations
│   └── seed.js          # Sample data
├── views/
│   ├── admin/           # Dashboard views
│   ├── auth/            # Login/register
│   ├── embed/           # Embeddable feed
│   ├── partials/        # Reusable components
│   └── posts/           # Post forms
├── uploads/             # Uploaded images
├── server.js            # Express app entry
├── package.json
├── railway.json         # Railway deployment config
├── Procfile
└── README.md
```

## License

MIT
