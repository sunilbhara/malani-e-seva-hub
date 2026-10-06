-- B1: publish scheduled posts every 5 minutes.
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule('publish-due-posts', '*/5 * * * *', 'SELECT public.publish_due_posts()');
