/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  createAnnouncementAction,
  updateAnnouncementAction,
  deleteAnnouncementAction,
  uploadPosterAction,
  deletePosterAction,
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
            poster_path: "4fa2bb57-dca2-4952-b1e1-1e96a40fb288.png",
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
            poster_path: "4fa2bb57-dca2-4952-b1e1-1e96a40fb288.png",
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
              poster_path: "7da1ee57-bca2-4952-a1e1-1e96a40fa399.png",
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

  // 2. File Signature Validations (PNG/JPEG signatures)
  describe("Poster File Signature & Extension/MIME Checks", () => {
    it("should accept valid PNG signature and matching png extension and MIME type", async () => {
      const formData = new FormData();
      // PNG Signature: 89 50 4E 47 0D 0A 1A 0A
      const bytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 1, 2]);
      const mockFile = new File([bytes], "test-poster.png", { type: "image/png" });
      formData.append("file", mockFile);

      const result = await uploadPosterAction(formData);
      expect(result.status).toBe("success");
      expect(result).toHaveProperty("poster_path");
    });

    it("should accept valid JPEG signature and matching jpeg extension and MIME type", async () => {
      const formData = new FormData();
      // JPEG Signature: FF D8 FF
      const bytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0, 1, 2]);
      const mockFile = new File([bytes], "test-poster.jpeg", { type: "image/jpeg" });
      formData.append("file", mockFile);

      const result = await uploadPosterAction(formData);
      expect(result.status).toBe("success");
    });

    it("should reject fake JPG content (plain text renamed to .jpg)", async () => {
      const formData = new FormData();
      const mockFile = new File([new TextEncoder().encode("not-a-jpeg-content")], "fake-image.jpg", { type: "image/jpeg" });
      formData.append("file", mockFile);

      const result = await uploadPosterAction(formData);
      expect(result.status).toBe("error");
      expect(result.message).toBe("Tandatangan fail tidak sah. Hanya fail imej PNG dan JPEG yang sebenar sahaja dibenarkan.");
    });

    it("should reject fake PNG content (plain text renamed to .png)", async () => {
      const formData = new FormData();
      const mockFile = new File([new TextEncoder().encode("not-a-png-content")], "fake-image.png", { type: "image/png" });
      formData.append("file", mockFile);

      const result = await uploadPosterAction(formData);
      expect(result.status).toBe("error");
      expect(result.message).toBe("Tandatangan fail tidak sah. Hanya fail imej PNG dan JPEG yang sebenar sahaja dibenarkan.");
    });

    it("should reject MIME/signature mismatch (PNG signature renamed to .jpg)", async () => {
      const formData = new FormData();
      const bytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const mockFile = new File([bytes], "fake-image.jpg", { type: "image/jpeg" });
      formData.append("file", mockFile);

      const result = await uploadPosterAction(formData);
      expect(result.status).toBe("error");
      expect(result.message).toBe("Sambungan fail tidak sepadan dengan tandatangan imej PNG.");
    });

    it("should reject files over 10 MB", async () => {
      const formData = new FormData();
      const overSizedBuffer = new ArrayBuffer(11 * 1024 * 1024);
      const mockFile = new File([overSizedBuffer], "huge-poster.png", { type: "image/png" });
      formData.append("file", mockFile);

      const result = await uploadPosterAction(formData);
      expect(result.status).toBe("error");
      expect(result.message).toBe("Ukuran fail melebihi had maksimum 10 MB.");
    });
  });

  // 3. Strict poster_path restriction tests
  describe("Poster Path Traversal & Restriction Checks", () => {
    it("should reject path traversal attempting to go up directory (../other-file.png)", async () => {
      const invalidData = {
        title_bm: "Hebahan Penting",
        title_en: "Important Notice",
        body_bm: "Kandungan BM",
        body_en: "Content EN",
        category: "Umum",
        poster_path: "../other-file.png",
        status: "PUBLISHED" as const,
      };

      const result = await createAnnouncementAction(invalidData);
      expect(result.status).toBe("error");
      expect(result.message).toBe("Format nama fail poster tidak sah.");
    });

    it("should reject sub-folder path attempts (folder/file.jpg)", async () => {
      const invalidData = {
        title_bm: "Hebahan Penting",
        title_en: "Important Notice",
        body_bm: "Kandungan BM",
        body_en: "Content EN",
        category: "Umum",
        poster_path: "folder/file.jpg",
        status: "PUBLISHED" as const,
      };

      const result = await createAnnouncementAction(invalidData);
      expect(result.status).toBe("error");
      expect(result.message).toBe("Format nama fail poster tidak sah.");
    });

    it("should accept a valid generated UUID poster path (UUID.png)", async () => {
      const validData = {
        title_bm: "Hebahan Penting",
        title_en: "Important Notice",
        body_bm: "Kandungan BM",
        body_en: "Content EN",
        category: "Umum",
        poster_path: "4fa2bb57-dca2-4952-b1e1-1e96a40fb288.png",
        status: "PUBLISHED" as const,
      };

      const result = await createAnnouncementAction(validData);
      expect(result.status).toBe("success");
    });

    it("should reject invalid deletePosterAction path", async () => {
      const result = await deletePosterAction("../malicious.png");
      expect(result.status).toBe("error");
      expect(result.message).toBe("Nama fail poster tidak sah.");
    });

    it("should accept valid deletePosterAction path", async () => {
      const result = await deletePosterAction("4fa2bb57-dca2-4952-b1e1-1e96a40fb288.png");
      expect(result.status).toBe("success");
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
