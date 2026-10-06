-- Infrastructure for edge functions: settings, AI rate limit log, publish broadcast hook,
-- reminder and weekly digest schedules.

CREATE EXTENSION IF NOT EXISTS pg_net;

-- Server-side settings (no client access: RLS on, no policies).
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_settings FROM anon, authenticated;

-- S1: per-admin rate limit for the AI generator.
CREATE TABLE IF NOT EXISTS public.ai_generation_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_generation_log_user_time_idx ON public.ai_generation_log (user_id, created_at DESC);
ALTER TABLE public.ai_generation_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_generation_log FROM anon, authenticated;

-- Each post is broadcast (Telegram + web push) at most once.
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS broadcast_at TIMESTAMPTZ;

-- Weekly digest idempotency.
CREATE TABLE IF NOT EXISTS public.newsletter_sends (
  week_start DATE PRIMARY KEY,
  sent_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.newsletter_sends ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.newsletter_sends FROM anon, authenticated;

-- Calls an edge function by name using the configured base URL. Never raises.
CREATE OR REPLACE FUNCTION public.call_edge_function(p_name TEXT, p_body JSONB DEFAULT '{}'::jsonb)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base TEXT;
BEGIN
  SELECT value INTO base FROM public.app_settings WHERE key = 'functions_base_url';
  IF base IS NULL THEN
    RETURN;
  END IF;
  PERFORM net.http_post(
    url := base || '/functions/v1/' || p_name,
    body := p_body,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 10000
  );
EXCEPTION WHEN others THEN
  RAISE LOG 'call_edge_function(%) failed: %', p_name, SQLERRM;
END;
$$;
REVOKE ALL ON FUNCTION public.call_edge_function(TEXT, JSONB) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.broadcast_on_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'published'
     AND NEW.published_at <= now()
     AND NEW.broadcast_at IS NULL
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published') THEN
    PERFORM public.call_edge_function('on-publish', jsonb_build_object('post_id', NEW.id));
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.broadcast_on_publish() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS posts_broadcast_on_publish ON public.posts;
CREATE TRIGGER posts_broadcast_on_publish
  AFTER INSERT OR UPDATE OF status ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.broadcast_on_publish();

-- 08:00 IST daily reminders, 08:00 IST Sunday digest.
SELECT cron.schedule('send-reminders', '30 2 * * *', $cron$SELECT public.call_edge_function('send-reminders')$cron$);
SELECT cron.schedule('weekly-digest', '30 2 * * 0', $cron$SELECT public.call_edge_function('weekly-digest')$cron$);
