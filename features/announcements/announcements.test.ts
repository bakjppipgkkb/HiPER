/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  createAnnouncementAction,
  updateAnnouncementAction,
  deleteAnnouncementAction,
  uploadPosterAction,
} from "./actions";
import { getAdminState } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";

// Mock external dependencies
vi.mock("@/lib/auth/authorization", () => ({
  getAdminState: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Pengumuman Module Server Actions & Validations", () => {
  const mockAdminState = vi.mocked(getAdminState);
  const mockCreateClient = vi.mocked(createClient);

  // Mock Supabase methods
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockStorageUpload = vi.fn();
  const mockStorageRemove = vi.fn();

  const mockSupabase = {
    from: vi.fn((table: string) => {
      if (table === "announcements") {
        return {
          insert: mockInsert,
          update: mockUpdate,
          delete: mockDelete,
          select: mockSelect,
        } as any;
      }
      if (table === "audit_log") {
        return {
          insert: vi.fn().mockReturnValue({ error: null }),
        } as any;
      }
      return {
        insert: vi.fn().mockReturnValue({ error: null }),
      } as any;
    }),
    storage: {
      from: vi.fn((bucket: string) => {
        if (bucket === "announcement-posters") {
          return {
            upload: mockStorageUpload,
            remove: mockStorageRemove,
          } as any;
        }
        return {} as any;
      }),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateClient.mockResolvedValue(mockSupabase as any);
    mockAdminState.mockResolvedValue({
      status: "authorized",
      userId: "admin-user-id",
      email: "admin@ipgkkb.edu.my",
    });

    // Reset default mock behaviors
    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: "announcement-123",
            title_bm: "Tajuk BM",
            title_en: "Title EN",
            body_bm: "Kandungan BM",
            body_en: "Content EN",
            category: "Akademik",
            poster_path: "poster.png",
            status: "PUBLISHED",
            published_at: "2026-08-05T00:00:00.000Z",
          },
          error: null,
        }),
      }),
    } as any);

    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: "announcement-123",
            title_bm: "Tajuk BM",
            title_en: "Title EN",
            body_bm: "Kandungan BM",
            body_en: "Content EN",
            category: "Akademik",
            poster_path: "poster.png",
            status: "PUBLISHED",
            published_at: "2026-08-05T00:00:00.000Z",
          },
          error: null,
        }),
      }),
    } as any);

    mockUpdate.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "announcement-123",
              title_bm: "Tajuk BM Kemaskini",
              title_en: "Title EN Updated",
              body_bm: "Kandungan BM Kemaskini",
              body_en: "Content EN Updated",
              category: "Akademik",
              poster_path: "new-poster.png",
              status: "PUBLISHED",
              published_at: "2026-08-05T00:00:00.000Z",
            },
            error: null,
          }),
        }),
      }),
    } as any);

    mockDelete.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    } as any);

    mockStorageUpload.mockResolvedValue({ data: { path: "safe-file.png" }, error: null });
    mockStorageRemove.mockResolvedValue({ data: [], error: null });
  });

  // 1. Malay Validation Messages
  describe("Malay Validation Messages", () => {
    it("should return correct Malay errors for empty title_bm", async () => {
      const invalidData = {
        title_bm: "",
        title_en: "Title EN",
        body_bm: "Kandungan BM",
        body_en: "Content EN",
        category: "Kewangan",
        status: "DRAFT",
      };

      const result = await createAnnouncementAction(invalidData);
      expect(result.status).toBe("validation_error");
      expect(result.message).toBe("Tajuk (BM) wajib diisi");
    });

    it("should return correct Malay errors for empty body_bm", async () => {
      const invalidData = {
        title_bm: "Tajuk BM",
        title_en: "Title EN",
        body_bm: " ",
        body_en: "Content EN",
        category: "Kewangan",
        status: "DRAFT",
      };

      const result = await createAnnouncementAction(invalidData);
      expect(result.status).toBe("validation_error");
      expect(result.message).toBe("Kandungan (BM) wajib diisi");
    });

    it("should return correct Malay errors for empty category", async () => {
      const invalidData = {
        title_bm: "Tajuk BM",
        title_en: "Title EN",
        body_bm: "Kandungan BM",
        body_en: "Content EN",
        category: "",
        status: "DRAFT",
      };

      const result = await createAnnouncementAction(invalidData);
      expect(result.status).toBe("validation_error");
      expect(result.message).toBe("Kategori wajib diisi");
    });
  });

  // 2. PNG/JPEG Validation, Max 10MB, Invalid MIME types
  describe("Poster Upload Validations", () => {
    it("should accept valid PNG file under 10MB", async () => {
      const formData = new FormData();
      const mockFile = new File([new ArrayBuffer(1000)], "test-poster.png", { type: "image/png" });
      formData.append("file", mockFile);

      const result = await uploadPosterAction(formData);
      expect(result.status).toBe("success");
      expect(result).toHaveProperty("poster_path");
    });

    it("should accept valid JPEG file under 10MB", async () => {
      const formData = new FormData();
      const mockFile = new File([new ArrayBuffer(1000)], "test-poster.jpg", { type: "image/jpeg" });
      formData.append("file", mockFile);

      const result = await uploadPosterAction(formData);
      expect(result.status).toBe("success");
    });

    it("should reject files over 10 MB", async () => {
      const formData = new FormData();
      // 10.5 MB file
      const overSizedBuffer = new ArrayBuffer(11 * 1024 * 1024);
      const mockFile = new File([overSizedBuffer], "huge-poster.png", { type: "image/png" });
      formData.append("file", mockFile);

      const result = await uploadPosterAction(formData);
      expect(result.status).toBe("error");
      expect(result.message).toBe("Ukuran fail melebihi had maksimum 10 MB.");
    });

    it("should reject invalid file extensions", async () => {
      const formData = new FormData();
      const mockFile = new File([new ArrayBuffer(100)], "doc.pdf", { type: "application/pdf" });
      formData.append("file", mockFile);

      const result = await uploadPosterAction(formData);
      expect(result.status).toBe("error");
      expect(result.message).toBe("Hanya fail format PNG, JPG atau JPEG sahaja dibenarkan.");
    });

    it("should reject invalid MIME types", async () => {
      const formData = new FormData();
      // Name has correct extension but MIME type is unsafe/invalid
      const mockFile = new File([new ArrayBuffer(100)], "fake.png", { type: "text/html" });
      formData.append("file", mockFile);

      const result = await uploadPosterAction(formData);
      expect(result.status).toBe("error");
      expect(result.message).toBe("Jenis MIME tidak sah. Hanya PNG dan JPEG sahaja dibenarkan.");
    });
  });

  // 3. Poster path mapping
  describe("Poster Path Mapping", () => {
    it("should map poster_path correctly during creation", async () => {
      const validData = {
        title_bm: "Kempen Kebersihan",
        title_en: "Hygiene Campaign",
        body_bm: "Sila sertai aktiviti ini",
        body_en: "Please join us",
        category: "Kebajikan",
        poster_path: "campaign-banner.jpeg",
        status: "PUBLISHED" as const,
      };

      const result = await createAnnouncementAction(validData);
      expect(result.status).toBe("success");
      expect(result.data?.poster_path).toBe("poster.png"); // mocked returned data
    });
  });

  // 4. Text-only announcements
  describe("Text-only Announcements", () => {
    it("should allow creating announcements without any poster (text-only)", async () => {
      const textOnlyData = {
        title_bm: "Hebahan Penting",
        title_en: "Important Notice",
        body_bm: "Maklumat mesyuarat agung tahunan.",
        body_en: "Annual general meeting info.",
        category: "Mesyuarat",
        poster_path: null,
        status: "PUBLISHED" as const,
      };

      const result = await createAnnouncementAction(textOnlyData);
      expect(result.status).toBe("success");
    });
  });

  // 5. Unauthorized mutations
  describe("Unauthorized Mutation Attempts", () => {
    beforeEach(() => {
      mockAdminState.mockResolvedValue({
        status: "forbidden",
        email: "student@ipgkkb.edu.my",
      } as any);
    });

    it("should block unauthorized create actions", async () => {
      const validData = {
        title_bm: "Cuba Cerobot",
        title_en: "Intruder Attempt",
        body_bm: "Kandungan",
        body_en: "Content",
        category: "Umum",
        status: "PUBLISHED" as const,
      };

      const result = await createAnnouncementAction(validData);
      expect(result.status).toBe("error");
      expect(result.message).toContain("Akses dinafikan");
    });

    it("should block unauthorized update actions", async () => {
      const result = await updateAnnouncementAction("some-id", {
        title_bm: "Tajuk Baru",
        title_en: "New Title",
        body_bm: "Kandungan Baru",
        body_en: "New Content",
        category: "Umum",
        status: "PUBLISHED" as const,
      });
      expect(result.status).toBe("error");
      expect(result.message).toContain("Akses dinafikan");
    });

    it("should block unauthorized delete actions", async () => {
      const result = await deleteAnnouncementAction("some-id");
      expect(result.status).toBe("error");
      expect(result.message).toContain("Akses dinafikan");
    });
  });
});
