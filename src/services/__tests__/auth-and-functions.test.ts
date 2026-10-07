import { afterEach, describe, expect, it, vi } from "vitest";
import { opArgs, sb } from "@/test/supabaseMock";

vi.mock("@/lib/supabase", async () => ({ supabase: (await import("@/test/supabaseMock")).sb.supabase }));

const auth = await import("@/services/auth");
const fn = await import("@/services/functions");
const media = await import("@/services/media");
const ai = await import("@/services/ai");
const newsletter = await import("@/services/newsletter");
const profile = await import("@/services/profile");

const functionError = (status: number, body: unknown) => ({ context: new Response(JSON.stringify(body), { status }) });

describe("password rules", () => {
  it.each([
    ["short1", "कम से कम 8"],
    ["abcdefgh", "अक्षर और अंक"],
    ["12345678", "अक्षर और अंक"],
  ])("%s is rejected", (pw, msg) => expect(auth.passwordProblem(pw)).toContain(msg));
  it("letters + digits, 8+ chars is accepted", () => expect(auth.passwordProblem("barmer2026")).toBeNull());
});

describe("friendlyAuthError", () => {
  it.each([
    ["Invalid login credentials", "गलत है"],
    ["Email not confirmed", "पुष्टि"],
    ["User already registered", "पहले से रजिस्टर"],
    ["Email rate limit exceeded", "कुछ देर बाद"],
    ["Password is known to be weak and easy to guess (pwned)", "असुरक्षित"],
    ["Failed to fetch", "इंटरनेट"],
    ["something else", "दोबारा कोशिश"],
  ])("%s", (message, expected) => expect(auth.friendlyAuthError({ message })).toContain(expected));
});

describe("auth flows", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("signUp normalises email, keeps the redirect same-origin and stores the name", async () => {
    await auth.signUp("  Reader@Example.TEST ", "barmer2026", "  राम  ", "//evil.com");
    expect(sb.supabase.auth.signUp).toHaveBeenCalledWith({
      email: "reader@example.test",
      password: "barmer2026",
      options: { emailRedirectTo: `${window.location.origin}/`, data: { full_name: "राम" } },
    });
  });

  it("signUp refuses weak passwords before calling Supabase", async () => {
    await expect(auth.signUp("a@b.co", "weak", "")).rejects.toThrow("कम से कम 8");
    expect(sb.supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it("login and Google pass errors through; Google redirect is sanitised", async () => {
    sb.supabase.auth.signInWithPassword.mockResolvedValueOnce({ data: {}, error: { message: "Invalid login credentials" } } as never);
    await expect(auth.login("A@B.co", "x")).rejects.toEqual({ message: "Invalid login credentials" });
    expect(sb.supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: "a@b.co", password: "x" });
    await auth.signInWithGoogle("/blog/x#qa");
    expect(sb.supabase.auth.signInWithOAuth).toHaveBeenCalledWith({ provider: "google", options: { redirectTo: `${window.location.origin}/blog/x#qa` } });
  });

  it("password reset goes to /auth/reset; updatePassword validates", async () => {
    await auth.sendPasswordReset(" X@Y.co ");
    expect(sb.supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith("x@y.co", { redirectTo: `${window.location.origin}/auth/reset` });
    await expect(auth.updatePassword("short")).rejects.toThrow();
    await auth.updatePassword("newpass123");
    expect(sb.supabase.auth.updateUser).toHaveBeenCalledWith({ password: "newpass123" });
  });

  it("deleteAccount signs out locally only after the server confirms", async () => {
    sb.supabase.functions.invoke.mockResolvedValueOnce({ data: { status: "deleted" }, error: null });
    await auth.deleteAccount();
    expect(sb.supabase.functions.invoke).toHaveBeenCalledWith("delete-account", { body: { confirm: "DELETE" } });
    expect(sb.supabase.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("deleteAccount shows the server's reason (e.g. admins cannot delete) and keeps the session", async () => {
    sb.supabase.functions.invoke.mockResolvedValueOnce({ data: null, error: functionError(403, { error: "एडमिन खाता यहाँ से नहीं हटाया जा सकता।" }) });
    await expect(auth.deleteAccount()).rejects.toThrow("एडमिन खाता");
    expect(sb.supabase.auth.signOut).not.toHaveBeenCalled();
  });
});

describe("invokeFunction", () => {
  it("returns data on success", async () => {
    sb.supabase.functions.invoke.mockResolvedValueOnce({ data: { ok: 1 }, error: null });
    expect(await fn.invokeFunction("x", {})).toEqual({ ok: 1 });
  });

  it("raises FunctionError with server message, status and code", async () => {
    sb.supabase.functions.invoke.mockResolvedValueOnce({ data: null, error: functionError(429, { error: "बहुत ज़्यादा", code: "rate_limited" }) });
    const err = await fn.invokeFunction("x", {}).catch((e) => e);
    expect(err).toBeInstanceOf(fn.FunctionError);
    expect(err).toMatchObject({ message: "बहुत ज़्यादा", status: 429, code: "rate_limited" });
  });

  it("falls back to a generic Hindi message when the body is not JSON", async () => {
    sb.supabase.functions.invoke.mockResolvedValueOnce({ data: null, error: { context: new Response("oops", { status: 502 }) } });
    await expect(fn.invokeFunction("x", {})).rejects.toMatchObject({ status: 502, message: expect.stringContaining("उपलब्ध नहीं") });
  });
});

describe("media uploads", () => {
  afterEach(() => vi.unstubAllGlobals());
  const file = (type: string, size: number) => new File([new Uint8Array(size)], "x", { type });

  it("validates type and size", () => {
    expect(media.validateImage(file("image/gif", 10))).toContain("JPG");
    expect(media.validateImage(file("image/png", 6 * 1024 * 1024))).toContain("5 MB");
    expect(media.validateImage(file("image/webp", 1000))).toBeNull();
  });

  it("adds the delivery transform once", () => {
    expect(media.deliveryUrl("https://res.cloudinary.com/c/image/upload/v1/a.jpg")).toBe("https://res.cloudinary.com/c/image/upload/f_auto,q_auto:good,w_1400,c_limit/v1/a.jpg");
    expect(media.deliveryUrl("https://other/x.jpg")).toBe("https://other/x.jpg");
  });

  it("uploads with a server signature (no unsigned preset)", async () => {
    sb.supabase.functions.invoke.mockResolvedValueOnce({ data: { cloudName: "demo", apiKey: "k", timestamp: 1, folder: "malani-blog", signature: "sig" }, error: null });
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ secure_url: "https://res.cloudinary.com/demo/image/upload/v1/x.webp" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const url = await media.uploadBlogImage(file("image/jpeg", 2000));
    expect(url).toContain("/upload/f_auto,q_auto:good,w_1400,c_limit/");
    const [endpoint, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(endpoint).toBe("https://api.cloudinary.com/v1_1/demo/image/upload");
    const body = init.body as FormData;
    expect(body.get("signature")).toBe("sig");
    expect(body.get("upload_preset")).toBeNull();
  });

  it("reports Cloudinary errors and rejects invalid files before signing", async () => {
    await expect(media.uploadBlogImage(file("text/plain", 5))).rejects.toThrow("JPG");
    expect(sb.supabase.functions.invoke).not.toHaveBeenCalled();
    sb.supabase.functions.invoke.mockResolvedValueOnce({ data: { cloudName: "d", apiKey: "k", timestamp: 1, folder: "f", signature: "s" }, error: null });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: { message: "Invalid signature" } }), { status: 401 })));
    await expect(media.uploadBlogImage(file("image/png", 10))).rejects.toThrow("Invalid signature");
  });
});

describe("AI drafts", () => {
  it("requires input and sanitises returned HTML", async () => {
    await expect(ai.generateDraft("  ")).rejects.toThrow("पेस्ट करें");
    sb.supabase.functions.invoke.mockResolvedValueOnce({
      data: { title: "T", metaDescription: "", content: '<p onclick="x()">ok</p><script>alert(1)</script>', postType: "job", tags: [], job: null },
      error: null,
    });
    const draft = await ai.generateDraft(" details ");
    expect(draft.content).toBe("<p>ok</p>");
    expect(sb.supabase.functions.invoke).toHaveBeenCalledWith("generate-blog", { body: { rawDetails: "details" } });
  });
});

describe("newsletter and profile", () => {
  it("subscribe sends normalised email with consent", async () => {
    sb.supabase.functions.invoke.mockResolvedValueOnce({ data: { status: "pending" }, error: null });
    expect(await newsletter.subscribeNewsletter({ email: " A@B.CO ", categories: [] })).toEqual({ status: "pending" });
    expect(sb.supabase.functions.invoke).toHaveBeenCalledWith("newsletter", {
      body: { action: "subscribe", email: "a@b.co", categories: [], consent: true, turnstileToken: undefined },
    });
  });

  it("display names cannot be empty or an email, and are capped", async () => {
    await expect(profile.updateDisplayName("u", "  ")).rejects.toThrow("खाली");
    await expect(profile.updateDisplayName("u", "me@mail.com")).rejects.toThrow("ईमेल");
    await profile.updateDisplayName("u", "x".repeat(100));
    expect((opArgs(sb.find("profiles", "update")[0], "update")?.[0] as { full_name: string }).full_name).toHaveLength(80);
  });

  it("getUserRole: admin wins, none means null, errors mean null", async () => {
    sb.on({ name: "user_roles" }, { data: [{ role: "user" }, { role: "admin" }] });
    expect(await profile.getUserRole("u")).toBe("admin");
    sb.on({ name: "user_roles" }, { data: [{ role: "user" }] });
    expect(await profile.getUserRole("u")).toBe("user");
    sb.on({ name: "user_roles" }, { data: [] });
    expect(await profile.getUserRole("u")).toBeNull();
    sb.on({ name: "user_roles" }, { error: { message: "x" } });
    expect(await profile.getUserRole("u")).toBeNull();
  });

  it("remote preferences upsert on user_id", async () => {
    await profile.saveRemotePreferences("u", { qualification: "12th", departments: ["police"], district: "barmer" });
    expect(opArgs(sb.find("user_preferences", "upsert")[0], "upsert")).toEqual([
      expect.objectContaining({ user_id: "u", qualification: "12th", departments: ["police"], district: "barmer" }),
      { onConflict: "user_id" },
    ]);
  });
});
