import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "@/test/render";
import { signIn } from "@/test/authMock";
import { toast } from "@/test/sonnerMock";

vi.mock("@/hooks/useAuth", () => import("@/test/authMock"));
vi.mock("sonner", () => import("@/test/sonnerMock"));
vi.mock("@/services/auth", async (orig) => {
  const real = await orig<typeof import("@/services/auth")>();
  return { ...real, login: vi.fn(), signUp: vi.fn(), sendPasswordReset: vi.fn(), signInWithGoogle: vi.fn() };
});

const auth = await import("@/services/auth");
const { default: Login } = await import("@/pages/Login");

const user = () => userEvent.setup();

describe("Login page", () => {
  it("signs in and returns to the requested page", async () => {
    vi.mocked(auth.login).mockResolvedValue({} as never);
    const { location } = renderRoute(<Login />, { route: "/login?redirect=%2Fblog%2Fx%23qa", path: "/login" });
    await user().type(screen.getByLabelText("ईमेल"), "reader@example.test");
    await user().type(screen.getByLabelText("पासवर्ड"), "barmer2026");
    await user().click(screen.getByRole("button", { name: "साइन इन" }));
    expect(auth.login).toHaveBeenCalledWith("reader@example.test", "barmer2026");
    await waitFor(() => expect(location()).toBe("/blog/x#qa"));
    expect(toast.success).toHaveBeenCalledWith("स्वागत है!");
  });

  it("never redirects off-site after login (open-redirect guard)", async () => {
    vi.mocked(auth.login).mockResolvedValue({} as never);
    const { location } = renderRoute(<Login />, { route: "/login?redirect=%2F%2Fevil.com", path: "/login" });
    await user().type(screen.getByLabelText("ईमेल"), "a@b.co");
    await user().type(screen.getByLabelText("पासवर्ड"), "x");
    await user().click(screen.getByRole("button", { name: "साइन इन" }));
    await waitFor(() => expect(location()).toBe("/"));
  });

  it("shows a Hindi message for wrong credentials and stays on the page", async () => {
    vi.mocked(auth.login).mockRejectedValue(Object.assign(new Error("Invalid login credentials"), { status: 400 }));
    const { location } = renderRoute(<Login />, { route: "/login", path: "/login" });
    await user().type(screen.getByLabelText("ईमेल"), "a@b.co");
    await user().type(screen.getByLabelText("पासवर्ड"), "wrongpass1");
    await user().click(screen.getByRole("button", { name: "साइन इन" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ईमेल या पासवर्ड गलत है।");
    expect(location()).toBe("/login");
  });

  it("sign-up validates password strength before calling the server", async () => {
    renderRoute(<Login />, { route: "/login?action=signup", path: "/login" });
    expect(screen.getByRole("heading", { name: "मुफ़्त खाता बनाएँ" })).toBeInTheDocument();
    await user().type(screen.getByLabelText("ईमेल"), "a@b.co");
    await user().type(screen.getByLabelText("पासवर्ड"), "abcdefgh");
    await user().click(screen.getByRole("button", { name: "खाता बनाएँ" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("अक्षर और अंक");
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("sign-up success asks the reader to confirm their email", async () => {
    vi.mocked(auth.signUp).mockResolvedValue({} as never);
    renderRoute(<Login />, { route: "/login?action=signup&redirect=%2Fmy", path: "/login" });
    await user().type(screen.getByLabelText("आपका नाम"), "राम");
    await user().type(screen.getByLabelText("ईमेल"), "ram@example.test");
    await user().type(screen.getByLabelText("पासवर्ड"), "barmer2026");
    await user().click(screen.getByRole("button", { name: "खाता बनाएँ" }));
    expect(await screen.findByRole("heading", { name: "अपना ईमेल देखें" })).toBeInTheDocument();
    expect(screen.getByText("ram@example.test")).toBeInTheDocument();
    expect(auth.signUp).toHaveBeenCalledWith("ram@example.test", "barmer2026", "राम", "/my");
  });

  it("forgot-password sends a reset link", async () => {
    vi.mocked(auth.sendPasswordReset).mockResolvedValue();
    renderRoute(<Login />, { route: "/login", path: "/login" });
    await user().click(screen.getByRole("button", { name: "पासवर्ड भूल गए?" }));
    expect(screen.queryByLabelText("पासवर्ड")).not.toBeInTheDocument();
    await user().type(screen.getByLabelText("ईमेल"), "a@b.co");
    await user().click(screen.getByRole("button", { name: "लिंक भेजें" }));
    expect(await screen.findByText(/नया पासवर्ड बनाने का लिंक/)).toBeInTheDocument();
    expect(auth.sendPasswordReset).toHaveBeenCalledWith("a@b.co");
  });

  it("Google sign-in keeps the redirect and shows errors", async () => {
    vi.mocked(auth.signInWithGoogle).mockRejectedValueOnce(new Error("Failed to fetch"));
    renderRoute(<Login />, { route: "/login?redirect=%2Fquiz", path: "/login" });
    await user().click(screen.getByRole("button", { name: /Google से जारी रखें/ }));
    expect(auth.signInWithGoogle).toHaveBeenCalledWith("/quiz");
    expect(await screen.findByRole("alert")).toHaveTextContent("इंटरनेट");
  });

  it("password visibility toggle", async () => {
    renderRoute(<Login />, { route: "/login", path: "/login" });
    const pw = screen.getByLabelText("पासवर्ड");
    expect(pw).toHaveAttribute("type", "password");
    await user().click(screen.getByRole("button", { name: "पासवर्ड दिखाएँ" }));
    expect(pw).toHaveAttribute("type", "text");
  });

  it("already signed-in readers are sent to the redirect", async () => {
    signIn();
    const { location } = renderRoute(<Login />, { route: "/login?redirect=%2Fprofile", path: "/login" });
    await waitFor(() => expect(location()).toBe("/profile"));
  });
});
