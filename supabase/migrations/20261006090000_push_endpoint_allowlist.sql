-- SSRF guard: push endpoints come from the public upsert_push_subscription RPC and are later
-- POSTed to by the on-publish / send-reminders edge functions. Only accept real Web Push
-- services. Mirrors supabase/functions/_shared/pushHosts.ts.
CREATE OR REPLACE FUNCTION public.is_allowed_push_endpoint(p_endpoint TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT p_endpoint LIKE 'https://%'
    AND position('@' IN h) = 0
    AND position(':' IN h) = 0
    AND (
      h IN ('fcm.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com')
      OR h LIKE '%_.notify.windows.com'
      OR h LIKE '%_.push.apple.com'
    )
  FROM (SELECT lower(split_part(p_endpoint, '/', 3)) AS h) x;
$$;

DELETE FROM public.push_subscriptions WHERE NOT public.is_allowed_push_endpoint(endpoint);

ALTER TABLE public.push_subscriptions
  ADD CONSTRAINT push_subscriptions_endpoint_host CHECK (public.is_allowed_push_endpoint(endpoint));
