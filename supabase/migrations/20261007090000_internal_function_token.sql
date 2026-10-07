-- Internal edge functions (on-publish, send-reminders, weekly-digest) are deployed with
-- verify_jwt = false so the database can call them. Without a check, anyone could trigger
-- them (e.g. a daily newsletter blast). The database now sends a random token that only it
-- and the service role can read; the functions reject calls without it (see _shared/internal.ts).

INSERT INTO public.app_settings (key, value)
VALUES ('internal_function_token', encode(extensions.gen_random_bytes(32), 'hex'))
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.call_edge_function(p_name TEXT, p_body JSONB DEFAULT '{}'::jsonb)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base TEXT;
  token TEXT;
BEGIN
  SELECT value INTO base FROM public.app_settings WHERE key = 'functions_base_url';
  SELECT value INTO token FROM public.app_settings WHERE key = 'internal_function_token';
  IF base IS NULL THEN
    RETURN;
  END IF;
  PERFORM net.http_post(
    url := base || '/functions/v1/' || p_name,
    body := p_body,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-token', coalesce(token, '')),
    timeout_milliseconds := 10000
  );
EXCEPTION WHEN others THEN
  RAISE LOG 'call_edge_function(%) failed: %', p_name, SQLERRM;
END;
$$;
REVOKE ALL ON FUNCTION public.call_edge_function(TEXT, JSONB) FROM PUBLIC, anon, authenticated;
