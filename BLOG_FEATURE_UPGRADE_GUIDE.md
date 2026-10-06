# Blog Feature Upgrade Guide

This document explains the blog changes added in this upgrade, required environment variables, and the manual UI checks to perform after deployment.

## What Changed

### Admin Post Creation

- Added category selection while creating or editing posts.
- Added comma-separated tags such as `Admit Card`, `Result`, `Rajasthan Jobs`, `Barmer News`, `Exam Date`, and `Application Form`.
- Added post type selection for article, job, admit card, result, exam, local news, and guide posts.
- Added draft, scheduled, published, and archived post status.
- Added schedule date/time input for future publishing.
- Added SEO fields: SEO title, meta description, Open Graph image, canonical URL, source URL, and official link.
- Added verified source checkbox for government job, admit card, exam, and result posts.
- Added content templates for job, admit card, result, and local news posts.
- Added Cloudinary image upload with client-side compression and optimized delivery URL.
- Added Gemini Hindi blog writer button with the default Hindi SEO prompt for government job/exam content.

### Admin Analytics

- Added admin analytics cards for total posts, published posts, drafts, views, likes, and newsletter subscribers.
- Added trending posts panel based on views, likes, and comments.
- Added most-read categories panel.
- Added view/share/bookmark tracking tables in Supabase.

### Public Blog Listing

- Blog listing now filters by real categories, tags, and post type.
- Search now checks title, excerpt, content, category, and tags.
- Added newsletter subscription form.
- Added logged-in user notification preview.
- Added “Load more” pagination behavior.
- Blog cards now show category, tags, verified badge, views, likes, comments, bookmarks, and reading time.

### Blog Detail Page

- Added post view tracking.
- Added share count tracking.
- Added bookmark/save button.
- Added post reactions: Helpful, Important, Informative, and Urgent.
- Added tags, category, and verified label near the article title.
- Added official/source link block for verified government information.
- Added table of contents based on article headings.
- Added font-size controls for better reading.
- Existing SEO support is reused and extended with custom SEO description and Open Graph image fields.

### User Profile

- Added `/profile` page.
- Shows logged-in user profile information.
- Shows saved posts, liked posts, and recent comments.

## Supabase Changes

New migration:

`supabase/migrations/20260523110000_blog_feature_expansion.sql`

It adds optional post metadata and these new tables:

- `post_views`
- `post_bookmarks`
- `post_reactions`
- `newsletter_subscribers`
- `user_notifications`

Existing posts are kept safe by defaulting them to published status and using their existing `created_at` as `published_at`.

## Required Environment Variables

Keep all secrets in `.env` locally and provide them in production through your deployment pipeline.

```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
VITE_GEMINI_API_KEY=your_gemini_api_key
```

Do not commit real API keys or Cloudinary secrets to Git.

For Cloudinary, use an unsigned upload preset that is restricted from the Cloudinary dashboard. Do not expose your Cloudinary API secret in frontend code.

## Manual UI Test Checklist

### 1. Apply Database Migration

1. Apply the new Supabase migration.
2. Confirm existing posts still appear on `/blog`.
3. Confirm existing posts show as `published` in `/admin`.

### 2. Admin Create Post

1. Log in as an admin.
2. Open `/admin`.
3. Click `New Post`.
4. Add a title.
5. Select category and post type.
6. Add tags separated by commas.
7. Add content manually or select a content template.
8. Upload a cover image using Cloudinary.
9. Fill SEO title and meta description.
10. Add official link and source URL.
11. Enable verified checkbox.
12. Publish the post.
13. Confirm the post appears on `/blog`.

### 3. Draft Workflow

1. Create a new post.
2. Set status to `Save draft`.
3. Save it.
4. Confirm it appears in `/admin`.
5. Confirm it does not appear publicly on `/blog`.
6. Edit the draft and publish it.
7. Confirm it appears publicly after publishing.

### 4. Scheduled Workflow

1. Create a post.
2. Set status to `Schedule`.
3. Choose a future schedule date/time.
4. Save it.
5. Confirm it appears in `/admin` as scheduled.
6. Confirm it does not appear publicly until the scheduled/published logic is active in production.

### 5. Gemini Writer

1. Open the admin post sheet.
2. Click `Gemini Hindi Writer`.
3. Paste raw job/exam/admit card/result details.
4. Click `Generate Draft`.
5. Confirm generated Hindi content is inserted into the editor.
6. Review the content manually before publishing.

### 6. Public Blog Filters

1. Open `/blog`.
2. Filter by category.
3. Filter by tag.
4. Filter by post type.
5. Search using a job-related keyword.
6. Switch between latest and trending.
7. Use `Load more` when enough posts exist.

### 7. Newsletter

1. Open `/blog`.
2. Enter an email in the newsletter field.
3. Click subscribe.
4. Confirm the email appears in Supabase `newsletter_subscribers`.

### 8. Blog Post Actions

1. Open a blog post.
2. Confirm the view is recorded in `post_views`.
3. Click like.
4. Click bookmark/save.
5. Add reactions: Helpful, Important, Informative, Urgent.
6. Share the article.
7. Confirm likes, bookmarks, reactions, and share count update in Supabase.
8. Add a comment while logged in.
9. Confirm the comment appears under the post.

### 9. Reading Experience

1. Open a post with headings.
2. Confirm table of contents appears.
3. Test A-, A, and A+ font controls.
4. Confirm verified label appears for verified posts.
5. Confirm official/source buttons open in a new tab.

### 10. User Profile

1. Log in as a normal user.
2. Like a post.
3. Save a post.
4. Add a comment.
5. Open `/profile`.
6. Confirm saved posts, liked posts, and recent comments appear.

## Verification Run

Production build was verified with:

```bash
npm run build
```

The build passed. Vite still reports an existing chunk-size warning.

Lint was checked with:

```bash
npm run lint
```

Lint still has pre-existing unrelated issues in:

- `src/components/mobile/MobileSwiper.tsx`
- `src/vite-env.d.ts`
- Existing Fast Refresh warnings in shared UI/helper files

No real secrets were added to source code.
