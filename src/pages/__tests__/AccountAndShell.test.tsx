import { describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { renderRoute } from "@/test/render";
import { signIn } from "@/test/authMock";
import { toast } from "@/test/sonnerMock";
import { sb } from "@/test/supabaseMock";
import { savePreferences } from "@/lib/preferences";

vi.mock("@/hooks/useAuth", () => import("@/test/authMock"));
vi.mock("sonner", () => import("@/test/sonnerMock"));
vi.mock("@/lib/supabase", async () => ({ supabase: (await import("@/test/supabaseMock")).sb.supabase }));
vi.mock("@/services/profile", async (orig) => ({
  ...(await orig<typeof import("@/services/profile")>()),
  getProfile: vi.fn(async () => ({ id: "u1", full_name: "राम", avatar_url: null })),
  updateDisplayName: vi.fn(async () => undefined),
  saveRemotePreferences: vi.fn(async () => undefined),
}));
vi.mock("@/services/auth", async (orig) => ({
  ...(await orig<typeof import("@/services/auth")>()),
  logout: vi.fn(async () => undefined),
  deleteAccount: vi.fn(async () => undefined),
  updatePassword: vi.fn(async () => undefined),
}));
vi.mock("@/services/newsletter", () => ({ subscribeNewsletter: vi.fn() }));
vi.mock("@/lib/emailjs", async (orig) => ({ ...(await orig<typeof import("@/lib/emailjs")>()), sendEnquiry: vi.fn(async () => undefined) }));

const profileSvc = await import("@/services/profile");
const authSvc = await import("@/services/auth");
const newsletter = await import("@/services/newsletter");
const { FunctionError } = await import("@/services/functions");
const emailjs = await import("@/lib/emailjs");
const { config } = await import("@/lib/config");
const { default: Profile } = await import("@/pages/Profile");
const { default: ResetPassword } = await import("@/pages/ResetPassword");
const { default: NewsletterPage } = await import("@/pages/Newsletter");
const { NewsletterForm } = await import("@/components/engagement/NewsletterForm");
const { ContactForm } = await import("@/components/services/EnquiryForms");
const { default: ErrorBoundary } = await import("@/components/ErrorBoundary");
const { AppShell } = await import("@/components/layout/AppShell");

describe("Profile", () => {
  it("guests are redirected to login", async () => {
    const { location } = renderRoute(<Profile />, { route: "/profile" });
    await waitFor(() => expect(location()).toBe("/login?redirect=%2Fprofile"));
  });

  it("shows the reader's name, saves a new one and validates", async () => {
    signIn("user", "u1");
    renderRoute(<Profile />, { route: "/profile" });
    const input = await screen.findByLabelText("दिखने वाला नाम (सवाल-जवाब में)");
    await waitFor(() => expect(input).toHaveValue("राम"));
    expect(screen.queryByRole("link", { name: /एडमिन डैशबोर्ड/ })).not.toBeInTheDocument();
    await userEvent.clear(input);
    await userEvent.type(input, "राम सिंह");
    await userEvent.click(screen.getByRole("button", { name: "सेव करें" }));
    await waitFor(() => expect(profileSvc.updateDisplayName).toHaveBeenCalledWith("u1", "राम सिंह"));
    expect(toast.success).toHaveBeenCalledWith("नाम सेव हो गया");
  });

  it("admins see the admin shortcut", async () => {
    signIn("admin", "a1");
    renderRoute(<Profile />, { route: "/profile" });
    expect(await screen.findByRole("link", { name: /एडमिन डैशबोर्ड/ })).toHaveAttribute("href", "/admin");
  });

  it("shows saved preferences", async () => {
    signIn("user", "u1");
    savePreferences({ qualification: "graduate", departments: ["police"] });
    renderRoute(<Profile />, { route: "/profile" });
    expect(await screen.findByText("ग्रेजुएट · पुलिस")).toBeInTheDocument();
  });

  it("account deletion requires typing हटाएँ, then signs out to home", async () => {
    signIn("user", "u1");
    const { location } = renderRoute(<Profile />, { route: "/profile" });
    await userEvent.click(await screen.findByRole("button", { name: /खाता हमेशा के लिए हटाएँ/ }));
    const dialog = await screen.findByRole("alertdialog");
    const confirm = within(dialog).getByRole("button", { name: "हमेशा के लिए हटाएँ" });
    expect(confirm).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText("पुष्टि के लिए हटाएँ लिखें"), "हटाएँ");
    await userEvent.click(confirm);
    await waitFor(() => expect(authSvc.deleteAccount).toHaveBeenCalled());
    await waitFor(() => expect(location()).toBe("/"));
  });

  it("deletion errors keep the reader on the page", async () => {
    signIn("user", "u1");
    vi.mocked(authSvc.deleteAccount).mockRejectedValueOnce(new Error("एडमिन खाता यहाँ से नहीं हटाया जा सकता।"));
    const { location } = renderRoute(<Profile />, { route: "/profile" });
    await userEvent.click(await screen.findByRole("button", { name: /खाता हमेशा के लिए हटाएँ/ }));
    const dialog = await screen.findByRole("alertdialog");
    await userEvent.type(within(dialog).getByLabelText("पुष्टि के लिए हटाएँ लिखें"), "हटाएँ");
    await userEvent.click(within(dialog).getByRole("button", { name: "हमेशा के लिए हटाएँ" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("एडमिन खाता यहाँ से नहीं हटाया जा सकता।"));
    expect(location()).toBe("/profile");
  });

  it("sign out returns home", async () => {
    signIn("user", "u1");
    const { location } = renderRoute(<Profile />, { route: "/profile" });
    await userEvent.click(await screen.findByRole("button", { name: /साइन आउट/ }));
    await waitFor(() => expect(location()).toBe("/"));
  });
});

describe("Reset password", () => {
  it("expired links are explained", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderRoute(<ResetPassword />, { route: "/auth/reset" });
    await act(async () => vi.advanceTimersByTime(4500));
    expect(await screen.findByText(/लिंक पुराना हो गया है/)).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("recovery session: passwords must match, then saves and goes home", async () => {
    const { location } = renderRoute(<ResetPassword />, { route: "/auth/reset" });
    act(() => sb.emitAuth("PASSWORD_RECOVERY", { user: { id: "u" } }));
    const pw = await screen.findByLabelText("नया पासवर्ड");
    await userEvent.type(pw, "newpass123");
    await userEvent.type(screen.getByLabelText("पासवर्ड दोबारा लिखें"), "different1");
    await userEvent.click(screen.getByRole("button", { name: "पासवर्ड सेव करें" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("दोनों पासवर्ड एक जैसे नहीं हैं।");
    await userEvent.clear(screen.getByLabelText("पासवर्ड दोबारा लिखें"));
    await userEvent.type(screen.getByLabelText("पासवर्ड दोबारा लिखें"), "newpass123");
    await userEvent.click(screen.getByRole("button", { name: "पासवर्ड सेव करें" }));
    await waitFor(() => expect(authSvc.updatePassword).toHaveBeenCalledWith("newpass123"));
    await waitFor(() => expect(location()).toBe("/"));
  });
});

describe("Newsletter", () => {
  it("confirmation and unsubscribe links show the right message", () => {
    const { unmount } = renderRoute(<NewsletterPage />, { route: "/newsletter?status=confirmed" });
    expect(screen.getByRole("heading", { name: "ईमेल की पुष्टि हो गई!" })).toBeInTheDocument();
    unmount();
    const second = renderRoute(<NewsletterPage />, { route: "/newsletter?status=unsubscribed" });
    expect(screen.getByRole("heading", { name: "अनसब्सक्राइब हो गया" })).toBeInTheDocument();
    second.unmount();
    const third = renderRoute(<NewsletterPage />, { route: "/newsletter?status=whatever" });
    expect(screen.getByRole("heading", { name: "लिंक मान्य नहीं है" })).toBeInTheDocument();
    third.unmount();
    // Opened directly, without an email link: show the subscription form, not an error.
    renderRoute(<NewsletterPage />, { route: "/newsletter" });
    expect(screen.getByRole("heading", { name: "हर रविवार नौकरी अपडेट ईमेल पर" })).toBeInTheDocument();
    expect(screen.queryByText("लिंक मान्य नहीं है")).not.toBeInTheDocument();
  });

  it("form is hidden until the newsletter is enabled", () => {
    (config as { newsletterEnabled: boolean }).newsletterEnabled = false;
    renderRoute(<NewsletterForm />);
    expect(screen.queryByRole("heading", { name: /ईमेल पर हफ़्ते की नौकरियाँ/ })).not.toBeInTheDocument();
  });

  it("requires consent, then asks to confirm by email (double opt-in)", async () => {
    (config as { newsletterEnabled: boolean }).newsletterEnabled = true;
    vi.mocked(newsletter.subscribeNewsletter).mockResolvedValue({ status: "pending" });
    renderRoute(<NewsletterForm />);
    await userEvent.type(screen.getByLabelText("ईमेल"), "reader@example.test");
    await userEvent.click(screen.getByRole("button", { name: /सब्सक्राइब/ }));
    expect(toast.error).toHaveBeenCalledWith("कृपया सहमति वाले बॉक्स पर टिक करें।");
    expect(newsletter.subscribeNewsletter).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: /सब्सक्राइब/ }));
    expect(await screen.findByRole("status")).toHaveTextContent("पुष्टि लिंक");
    (config as { newsletterEnabled: boolean }).newsletterEnabled = false;
  });

  it("hides itself if the server says email is not configured", async () => {
    (config as { newsletterEnabled: boolean }).newsletterEnabled = true;
    vi.mocked(newsletter.subscribeNewsletter).mockRejectedValue(new FunctionError("x", 503, "not_configured"));
    renderRoute(<NewsletterForm />);
    await userEvent.type(screen.getByLabelText("ईमेल"), "a@b.co");
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: /सब्सक्राइब/ }));
    await waitFor(() => expect(screen.queryByRole("button", { name: /सब्सक्राइब/ })).not.toBeInTheDocument());
    (config as { newsletterEnabled: boolean }).newsletterEnabled = false;
  });
});

describe("Contact form (e-Mitra enquiries)", () => {
  it("validates Indian mobile numbers and required fields", async () => {
    renderRoute(<ContactForm />);
    await userEvent.click(screen.getByRole("button", { name: /भेजें|submit|Send/i }));
    expect((await screen.findAllByRole("alert")).length).toBeGreaterThan(0);
    expect(emailjs.sendEnquiry).not.toHaveBeenCalled();
  });

  it("sends a valid enquiry with the honeypot guard", async () => {
    renderRoute(<ContactForm />);
    const inputs = screen.getAllByRole("textbox");
    const [name, , , service, message] = inputs;
    await userEvent.type(name, "राम");
    await userEvent.type(screen.getByRole("textbox", { name: /फ़ोन|फोन|मोबाइल|Phone/i }), "9876543210");
    await userEvent.type(service, "जाति प्रमाण पत्र");
    await userEvent.type(message, "कौनसे दस्तावेज़ लाने हैं?");
    await userEvent.click(screen.getByRole("button", { name: /भेजें|submit|Send/i }));
    await waitFor(() => expect(emailjs.sendEnquiry).toHaveBeenCalled());
    const [, params, guard] = vi.mocked(emailjs.sendEnquiry).mock.calls[0];
    expect(params).toMatchObject({ name: "राम", phone: "9876543210" });
    expect(params).not.toHaveProperty("website");
    expect(guard).toMatchObject({ honeypot: "" });
  });
});

describe("App shell", () => {
  function Shell({ route }: { route: string }) {
    return renderRoute(
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<h1>होम पेज</h1>} />
          <Route path="/jobs" element={<h1>नौकरियाँ पेज</h1>} />
          <Route path="/blog/:slug" element={<h1>पोस्ट</h1>} />
          <Route path="/boom" element={<Boom />} />
        </Route>
      </Routes>,
      { route },
    );
  }
  function Boom(): never {
    throw new Error("render crash");
  }

  it("has a skip link, header navigation and the bottom nav", async () => {
    Shell({ route: "/" });
    expect(screen.getByRole("link", { name: "मुख्य सामग्री पर जाएँ" })).toHaveAttribute("href", "#main");
    expect(screen.getByRole("navigation", { name: "मुख्य नेविगेशन" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "नीचे का नेविगेशन" })).toBeInTheDocument();
  });

  it("bottom nav has a सेवाएँ tab that is active on all three shop pages", () => {
    for (const route of ["/services", "/mobile-electronics", "/mataji-studio"]) {
      const { unmount } = renderRoute(
        <Routes>
          <Route element={<AppShell />}>
            <Route path="*" element={<h1>दुकान</h1>} />
          </Route>
        </Routes>,
        { route },
      );
      const nav = screen.getByRole("navigation", { name: "नीचे का नेविगेशन" });
      expect(within(nav).getByRole("link", { name: "सेवाएँ" })).toHaveAttribute("aria-current", "page");
      expect(within(nav).getByRole("link", { name: "होम" })).not.toHaveAttribute("aria-current");
      unmount();
    }
  });

  it("admin pages hide the reader bottom nav and use the short footer", () => {
    renderRoute(
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/admin" element={<h1>एडमिन</h1>} />
        </Route>
      </Routes>,
      { route: "/admin" },
    );
    expect(screen.queryByRole("navigation", { name: "नीचे का नेविगेशन" })).not.toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "सोशल मीडिया" })).not.toBeInTheDocument();
  });

  it("footer: call/WhatsApp/directions actions, labelled social links, no language switch", () => {
    Shell({ route: "/" });
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByRole("link", { name: /कॉल करें/ })).toHaveAttribute("href", expect.stringMatching(/^tel:/));
    expect(within(footer).getByRole("link", { name: /रास्ता/ })).toHaveAttribute("href", expect.stringContaining("google.com/maps"));
    const social = within(footer).getByRole("list", { name: "सोशल मीडिया" });
    expect(within(social).getByRole("link", { name: "Instagram" })).toHaveAttribute("target", "_blank");
    expect(within(social).getByRole("link", { name: "YouTube" })).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(within(footer).queryByText("English")).not.toBeInTheDocument();
  });

  it("post pages replace the bottom nav with their own action bar", () => {
    Shell({ route: "/blog/x" });
    expect(screen.queryByRole("navigation", { name: "नीचे का नेविगेशन" })).not.toBeInTheDocument();
  });

  it("never interrupts with a preferences popup, even on later page views", async () => {
    localStorage.setItem("malani-page-views", "5");
    Shell({ route: "/" });
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not ask on the first visit", async () => {
    Shell({ route: "/" });
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("a crashing page shows a friendly error inside the layout", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    Shell({ route: "/boom" });
    expect(screen.getByText("कुछ गड़बड़ हो गई")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "मुख्य नेविगेशन" })).toBeInTheDocument();
  });
});

describe("ErrorBoundary", () => {
  it("renders children normally", () => {
    render(<ErrorBoundary><p>ठीक है</p></ErrorBoundary>);
    expect(screen.getByText("ठीक है")).toBeInTheDocument();
  });
});
