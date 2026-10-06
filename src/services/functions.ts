// Calls to Supabase edge functions with readable errors.
import { supabase } from "@/lib/supabase";

export class FunctionError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

export async function invokeFunction<T>(name: string, body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body });
  if (error) {
    const context = (error as { context?: Response }).context;
    const status = context?.status ?? 500;
    const payload = context ? await context.clone().json().catch(() => null) : null;
    throw new FunctionError(payload?.error ?? "सेवा अभी उपलब्ध नहीं है। कृपया बाद में कोशिश करें।", status, payload?.code);
  }
  return data as T;
}
