// Realistic data shapes shared by integration tests.
import type { PostDetail, PostListItem } from "@/services/posts";
import { istToday } from "@/lib/format";

export function daysFromToday(n: number): string {
  const d = new Date(`${istToday()}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

let seq = 0;

export function listItem(overrides: Partial<PostListItem> = {}): PostListItem {
  seq += 1;
  return {
    id: `00000000-0000-4000-8000-${String(seq).padStart(12, "0")}`,
    title: `भर्ती ${seq}`,
    slug: `bharti-${seq}`,
    excerpt: "संक्षिप्त विवरण",
    image_url: null,
    category: "Government Job",
    tags: [],
    post_type: "job",
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_verified: true,
    read_time_min: 2,
    views_count: 0,
    likes_count: 0,
    comments_count: 0,
    share_count: 0,
    organisation: "RSMSSB",
    total_posts: 100,
    qualifications: ["graduate"],
    departments: ["rsmssb"],
    state: "rajasthan",
    apply_start: daysFromToday(-5),
    last_date: daysFromToday(20),
    exam_date: null,
    recruitment_id: null,
    job_status: "open",
    days_left: 20,
    ...overrides,
  };
}

export function postDetail(overrides: Partial<PostDetail> = {}, job: Partial<NonNullable<PostDetail["job"]>> | null = {}): PostDetail {
  const id = overrides.id ?? "aaaaaaaa-0000-4000-8000-000000000001";
  return {
    id,
    title: "राजस्थान पुलिस कांस्टेबल भर्ती 2026",
    slug: "rajasthan-police-2026",
    content: "<h2>भर्ती विवरण</h2><p>कुल 9617 पद।</p><h2>योग्यता</h2><p>12वीं पास</p><h2>आवेदन कैसे करें</h2><ol><li>वेबसाइट खोलें</li></ol>",
    excerpt: "भर्ती विवरण कुल 9617 पद",
    image_url: null,
    category: "Government Job",
    tags: ["police"],
    status: "published",
    post_type: "job",
    published_at: "2026-10-01T05:00:00Z",
    updated_at: "2026-10-02T05:00:00Z",
    created_at: "2026-10-01T05:00:00Z",
    scheduled_at: null,
    author_id: "admin-1",
    language: "hi",
    seo_title: null,
    seo_description: null,
    og_image_url: null,
    canonical_url: null,
    source_url: "https://police.rajasthan.gov.in/notice.pdf",
    official_link: "https://police.rajasthan.gov.in",
    is_verified: true,
    read_time_min: 2,
    views_count: 10,
    likes_count: 3,
    comments_count: 0,
    share_count: 1,
    bookmarks_count: 0,
    broadcast_at: null,
    author: { id: "admin-1", full_name: "मालाणी टीम", avatar_url: null },
    job:
      job === null
        ? null
        : ({
            post_id: id,
            recruitment_id: "rec-1",
            organisation: "राजस्थान पुलिस",
            total_posts: 9617,
            qualifications: ["12th"],
            departments: ["police"],
            state: "rajasthan",
            age_min: 18,
            age_max: 25,
            salary: "₹ 24,000",
            fees: [{ category: "सामान्य", amount: 600 }],
            apply_start: daysFromToday(-5),
            last_date: daysFromToday(3),
            fee_last_date: null,
            admit_card_date: null,
            exam_date: daysFromToday(60),
            result_date: null,
            extra_dates: [],
            apply_link: "https://police.rajasthan.gov.in/apply",
            notification_pdf: null,
            official_website: "https://police.rajasthan.gov.in",
            updated_at: "2026-10-01T05:00:00Z",
            ...job,
          } as NonNullable<PostDetail["job"]>),
    ...overrides,
  } as PostDetail;
}
