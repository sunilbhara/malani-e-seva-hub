# Blog Feature Usage Guide

This document explains how to use the blog feature in the Malani E-Seva Hub application.
It covers both `User` and `Admin` roles and describes the main workflows for reading, searching, liking, commenting, creating, editing, and managing blog posts.

---

## 1. Application Overview

The blog feature is a modern Hindi-friendly blogging platform inside the Malani E-Seva Hub app.
It supports:

- Responsive blog listing and detail pages
- Search and category filters
- Trending / latest feed switching
- Rich text blog content
- Likes, comments, and share actions
- Role-based access control for admin functions


## 2. User Role

### Who is a User?

A User is any visitor or authenticated person who can browse and interact with the blog content.

### What a User can do

- View the blog homepage and blog cards
- Search blog posts by title, excerpt, or content
- Filter posts by categories like updates, community and insights
- Switch between `Latest` and `Trending` feeds
- Open a blog post page to read full content
- Like blog posts
- Share blog posts using browser sharing or clipboard
- View author details and related posts
- Add comments after logging in

### How to use as a User

1. Open the blog page at `/blog`.
2. Use the search box to find keywords in titles, excerpts, or content.
3. Tap category buttons to filter posts by `All`, `Insights`, `Updates`, or `Community`.
4. Choose `Latest` or `Trending` tabs to change the ordering of posts.
5. Click a blog card to open the full article.
6. On the blog post page:
   - Read the article text.
   - View the published date and estimated reading time.
   - Tap the heart icon to like the post.
   - Tap the share icon to copy the URL or use native share.
7. If you are logged in, scroll to the comment section to leave a comment.

### Authentication for Users

- Certain actions require login, such as commenting and liking.
- Use the login flow on the app to sign in with your credentials.
- Once logged in, the app keeps the session and allows interaction.


## 3. Admin Role

### Who is an Admin?

An Admin is a user with elevated permissions for managing blog content.
Admins can create, edit, and remove blog posts.

### What an Admin can do

- Access the admin dashboard after signing in with an admin account
- View blog post statistics like total posts, comments, and likes
- Create new blog posts using the right-side content editor
- Edit existing blog posts from the dashboard list
- Delete posts that are no longer needed
- Publish posts directly from the admin panel

### How to use as an Admin

1. Sign in to the app with your admin credentials.
2. Open the admin dashboard at `/admin`.
3. Verify you can see the admin dashboard and stats.
4. To create a new post:
   - Click `New Post`.
   - Enter the `Title`, `Cover Image URL`, and `Content`.
   - Use the rich text editor to format content and add paragraphs.
   - Click `Publish` to save the post.
5. To edit an existing post:
   - In the admin table, click the edit icon next to a post.
   - Update the title, image URL, or content as needed.
   - Click `Save` to apply changes.
6. To delete a post:
   - Click the delete icon next to the post.
   - Confirm deletion in the alert dialog.

### Admin-specific notes

- The admin dashboard requires a valid admin role.
- If the app shows the admin dashboard, admin access is granted.
- If you still cannot edit posts, the issue may be related to Supabase authorization or session handling.


## 4. Common Blog Workflows

### Viewing and filtering posts

- Use the blog home page to scan featured posts.
- Combine search text with category filters for faster discovery.
- Trending posts are sorted by likes, while latest posts are sorted by date.

### Reading a post

- Click a blog card to go to the post detail page.
- Read the full content, and see the author and publication details.
- The page also includes related posts to explore more content.

### Liking and sharing

- Tap the heart icon to like or unlike a post.
- If you are not logged in, the app will ask you to sign in first.
- Use the share button to copy the post link or use native device sharing.

### Commenting

- If you are logged in, type a comment in the comment form.
- Submit the comment to publish it below the article.
- Comments help build community interaction on local news and updates.


## 5. Troubleshooting

### Admin edit fails with CORS or authorization errors

If you can view the admin dashboard but cannot update posts, check the following:

- Your admin session is still active and not expired.
- The request includes the Supabase auth token.
- The Supabase policy for `UPDATE` on `posts` allows admins.
- Your browser origin is allowed in Supabase settings.

### Blog content not loading

- Confirm the network connection is stable.
- Check console errors for Supabase or fetch failures.
- Verify the Supabase project URL and anon key are configured correctly.


## 6. Deployment and Environment

### Environment variables

The application uses these environment variables:

- `VITE_SUPABASE_URL` — your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — your Supabase anon/public API key
- `VITE_EMAILJS_PUBLIC_KEY` — public key for email integrations

### Running locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file with the required variables.
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## 7. Summary

This guide helps both Users and Admins manage the blog feature:

- `Users` can browse, search, read, like, share, and comment on blog posts.
- `Admins` can create, edit, publish, and delete posts from the admin dashboard.

Use `/blog` for the public blog experience and `/admin` for blog management.
