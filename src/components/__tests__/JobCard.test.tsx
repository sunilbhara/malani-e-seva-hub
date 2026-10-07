import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PostListItem } from "@/services/posts";

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: null, session: null, role: null, loading: false }) }));
vi.mock("@/services/posts", () => ({ recordShare: vi.fn(() => Promise.resolve()) }));
vi.mock("@/services/engagement", () => ({ listBookmarkIds: vi.fn(), setBookmarked: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const { JobCard } = await import("@/components/jobs/JobCard");
const { StatusBadge, CountdownChip } = await import("@/components/jobs/StatusBadge");
const { loadSavedIds } = await import("@/lib/savedPosts");

const post: PostListItem = {
  id: "11111111-1111-1111-1111-111111111111",
  title: "राजस्थान पुलिस कांस्टेबल भर्ती 2026",
  slug: "rajasthan-police-constable-2026",
  excerpt: null,
  image_url: null,
  category: "Government Job",
  tags: [],
  post_type: "job",
  published_at: "2026-10-01T05:00:00Z",
  updated_at: "2026-10-01T05:00:00Z",
  is_verified: true,
  read_time_min: 3,
  views_count: 10,
  likes_count: 0,
  comments_count: 0,
  share_count: 0,
  organisation: "राजस्थान पुलिस",
  total_posts: 9617,
  qualifications: ["12th"],
  departments: ["police"],
  state: "rajasthan",
  apply_start: "2026-10-01",
  last_date: "2026-10-30",
  exam_date: null,
  recruitment_id: null,
  job_status: "open",
  days_left: 24,
};

function renderCard(p: PostListItem = post) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <JobCard post={p} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("JobCard", () => {
  it("shows organisation, title link, facts and status", () => {
    renderCard();
    expect(screen.getByText("राजस्थान पुलिस")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: post.title })).toHaveAttribute("href", `/blog/${post.slug}`);
    expect(screen.getByText("9,617 पद")).toBeInTheDocument();
    expect(screen.getByText("30 अक्टू 2026")).toBeInTheDocument();
    expect(screen.getByText("आवेदन जारी")).toBeInTheDocument();
  });

  it("WhatsApp link carries a pre-filled message", () => {
    renderCard();
    const share = screen.getByRole("link", { name: "WhatsApp पर शेयर करें" });
    expect(share.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/\?text=/);
    expect(decodeURIComponent(share.getAttribute("href")!)).toContain("9,617 पद");
    expect(share).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("guests can save without an account", async () => {
    renderCard();
    const save = screen.getByRole("button", { name: "सेव करें" });
    expect(save).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(save);
    expect(loadSavedIds()).toEqual([post.id]);
    expect(await screen.findByRole("button", { name: "सेव से हटाएँ" })).toHaveAttribute("aria-pressed", "true");
  });

  it("closed jobs are dimmed", () => {
    const { container } = renderCard({ ...post, job_status: "closed", days_left: -2, last_date: "2026-10-01" });
    expect(container.querySelector("article")).toHaveClass("bg-muted/60");
    // Status badge and countdown chip both say it; colour is never the only signal.
    expect(screen.getAllByText("आवेदन बंद")).toHaveLength(2);
  });
});

describe("StatusBadge", () => {
  it("renders nothing without status", () => {
    const { container } = render(<StatusBadge status={null} />);
    expect(container).toBeEmptyDOMElement();
  });
  it("never relies on colour alone", () => {
    render(<StatusBadge status="closing" daysLeft={1} />);
    expect(screen.getByText("अंतिम तिथि नज़दीक")).toHaveClass("bg-status-urgent-bg");
  });
  it("countdown chip has an accessible label", () => {
    render(<CountdownChip lastDate="2000-01-01" status="closed" />);
    expect(screen.getByLabelText("आवेदन बंद हो चुका है")).toBeInTheDocument();
  });
});
