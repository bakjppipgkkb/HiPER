/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  validateAnnouncementFields,
  validatePosterFile
} from "./actions";

// Mock Supabase Server Client & Auth helper
const mockGetAdminState = vi.fn();
const mockSupabaseRemove = vi.fn();

// We will define chain methods that return the chain itself
const chain: any = {};

const mockSingle = vi.fn();
chain.single = mockSingle;
chain.select = vi.fn().mockReturnValue(chain);
chain.eq = vi.fn().mockReturnValue(chain);
chain.insert = vi.fn().mockReturnValue(chain);
chain.update = vi.fn().mockReturnValue(chain);
chain.delete = vi.fn().mockReturnValue(chain);

vi.mock("@/lib/auth/authorization", () => ({
  getAdminState: () => mockGetAdminState(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => {
      if (table === "announcements") {
        return chain;
      }
      if (table === "audit_log") {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return {};
    },
    storage: {
      from: (bucket: string) => {
        if (bucket === "announcement-posters") {
          return {
            remove: mockSupabaseRemove,
            upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
          };
        }
        return {};
      },
    },
  }),
}));

describe("HiPER Announcements Module Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock setup: Authorized admin
    mockGetAdminState.mockResolvedValue({
      status: "authorized",
      userId: "admin-uuid-123",
      email: "admin@test.com",
    });

    // Reset default single mock behavior
    mockSingle.mockReset();
    mockSingle.mockResolvedValue({ data: {}, error: null });

    mockSupabaseRemove.mockResolvedValue({ data: [], error: null });
  });

  // A. Malay Validation Messages Tests
  describe("Malay validation messages", () => {
    it("accepts valid input fields", async () => {
      const payload = {
        title_bm: "Pengumuman Penting",
        title_en: "Important Announcement",
        body_bm: "Ini adalah kandungan pengumuman.",
        body_en: "This is the announcement body.",
        category: "Umum",
        status: "DRAFT",
      };

      const result = await validateAnnouncementFields(payload);
      expect(result.isValid).toBe(true);
      expect(result.data.title_bm).toBe("Pengumuman Penting");
    });

    it("returns friendly Malay error messages for empty fields", async () => {
      const payload = {
        title_bm: "  ",
        title_en: "",
        body_bm: "",
        body_en: "",
        category: "",
        status: "INVALID",
      };

      const result = await validateAnnouncementFields(payload);
      expect(result.isValid).toBe(false);
      expect(result.errors.title_bm).toBe("Tajuk (BM) wajib diisi.");
      expect(result.errors.title_en).toBe("Tajuk (EN) wajib diisi.");
      expect(result.errors.body_bm).toBe("Kandungan (BM) wajib diisi.");
      expect(result.errors.body_en).toBe("Kandungan (EN) wajib diisi.");
      expect(result.errors.category).toBe("Kategori wajib diisi.");
      expect(result.errors.status).toBe("Status tidak sah.");
    });

    it("returns friendly Malay error messages when max length is exceeded", async () => {
      const payload = {
        title_bm: "a".repeat(181),
        title_en: "Valid English Title",
        body_bm: "b".repeat(10001),
        body_en: "Valid English Body",
        category: "c".repeat(81),
        status: "PUBLISHED",
      };

      const result = await validateAnnouncementFields(payload);
      expect(result.isValid).toBe(false);
      expect(result.errors.title_bm).toBe("Tajuk (BM) tidak boleh melebihi 180 aksara.");
      expect(result.errors.body_bm).toBe("Kandungan (BM) tidak boleh melebihi 10,000 aksara.");
      expect(result.errors.category).toBe("Kategori tidak boleh melebihi 80 aksara.");
    });
  });

  // B. Poster File Validations: PNG/JPEG, >10MB, MIME Types
  describe("Poster file size, type, and MIME validation", () => {
    it("accepts valid PNG under 10 MB", async () => {
      const fakeFile = {
        name: "poster.png",
        size: 5 * 1024 * 1024,
        type: "image/png",
      } as any;

      const result = await validatePosterFile(fakeFile);
      expect(result.isValid).toBe(true);
      expect(result.ext).toBe("png");
    });

    it("accepts valid JPEG under 10 MB", async () => {
      const fakeFile = {
        name: "poster.jpg",
        size: 8 * 1024 * 1024,
        type: "image/jpeg",
      } as any;

      const result = await validatePosterFile(fakeFile);
      expect(result.isValid).toBe(true);
      expect(result.ext).toBe("jpg");
    });

    it("rejects files over 10 MB with Malay error", async () => {
      const fakeFile = {
        name: "poster.png",
        size: 11 * 1024 * 1024, // 11 MB
        type: "image/png",
      } as any;

      const result = await validatePosterFile(fakeFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Fail melebihi had saiz 10 MB.");
    });

    it("rejects files with invalid extensions", async () => {
      const fakeFile = {
        name: "document.pdf",
        size: 2 * 1024 * 1024,
        type: "image/png", // mismatched MIME
      } as any;

      const result = await validatePosterFile(fakeFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Format fail tidak disokong. Hanya PNG, JPG dan JPEG dibenarkan.");
    });

    it("rejects files with invalid MIME types", async () => {
      const fakeFile = {
        name: "poster.png",
        size: 2 * 1024 * 1024,
        type: "application/pdf",
      } as any;

      const result = await validatePosterFile(fakeFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Jenis fail tidak sah. Sila pilih fail gambar PNG, JPG atau JPEG.");
    });
  });

  // C. Poster Path Mapping & Text-Only Support
  describe("Poster path mapping and text-only posts", () => {
    it("handles data mapping with text-only (null poster) correctly", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "new-announcement-uuid", title_bm: "Tajuk BM", status: "DRAFT", poster_path: null },
        error: null,
      });

      const formData = new FormData();
      formData.append("title_bm", "Tajuk BM");
      formData.append("title_en", "Title EN");
      formData.append("body_bm", "Kandungan BM");
      formData.append("body_en", "Kandungan EN");
      formData.append("category", "Kewangan");
      formData.append("status", "DRAFT");

      const mockInsertSpy = vi.spyOn(chain, "insert");

      await createAnnouncement(null, formData);

      expect(mockInsertSpy).toHaveBeenCalled();
      const lastInsertCall = mockInsertSpy.mock.calls[0][0] as any;
      expect(lastInsertCall.poster_path).toBeNull();
    });

    it("correctly generates published_at timestamp when status is set to PUBLISHED", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "new-announcement-uuid", title_bm: "Tajuk BM", status: "PUBLISHED", published_at: new Date().toISOString() },
        error: null,
      });

      const formData = new FormData();
      formData.append("title_bm", "Tajuk BM");
      formData.append("title_en", "Title EN");
      formData.append("body_bm", "Kandungan BM");
      formData.append("body_en", "Kandungan EN");
      formData.append("category", "Umum");
      formData.append("status", "PUBLISHED");

      const mockInsertSpy = vi.spyOn(chain, "insert");

      await createAnnouncement(null, formData);

      expect(mockInsertSpy).toHaveBeenCalled();
      const lastInsertCall = mockInsertSpy.mock.calls[0][0] as any;
      expect(lastInsertCall.published_at).not.toBeNull();
      expect(isNaN(Date.parse(lastInsertCall.published_at))).toBe(false);
    });

    it("ensures published_at is null when status is DRAFT", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "new-announcement-uuid", title_bm: "Tajuk BM", status: "DRAFT", published_at: null },
        error: null,
      });

      const formData = new FormData();
      formData.append("title_bm", "Tajuk BM");
      formData.append("title_en", "Title EN");
      formData.append("body_bm", "Kandungan BM");
      formData.append("body_en", "Kandungan EN");
      formData.append("category", "Umum");
      formData.append("status", "DRAFT");

      const mockInsertSpy = vi.spyOn(chain, "insert");

      await createAnnouncement(null, formData);

      expect(mockInsertSpy).toHaveBeenCalled();
      const lastInsertCall = mockInsertSpy.mock.calls[0][0] as any;
      expect(lastInsertCall.published_at).toBeNull();
    });

    it("correctly handles storage cleanup for replaced poster path on update", async () => {
      // Setup dynamic returns for single()
      mockSingle
        .mockResolvedValueOnce({
          data: { id: "existing-announcement-uuid", title_bm: "Tajuk Asal", status: "DRAFT", poster_path: "old-poster.png" },
          error: null,
        }) // First call to select existing record
        .mockResolvedValueOnce({
          data: { id: "existing-announcement-uuid", title_bm: "Tajuk Baru", status: "PUBLISHED", poster_path: "new-poster-name.jpg" },
          error: null,
        }); // Second call to return updated record

      const formData = new FormData();
      formData.append("title_bm", "Tajuk Baru");
      formData.append("title_en", "Title EN");
      formData.append("body_bm", "Kandungan BM");
      formData.append("body_en", "Kandungan EN");
      formData.append("category", "Umum");
      formData.append("status", "PUBLISHED");

      // Select file to replace
      const fakeFile = new File(["test"], "new-poster-name.jpg", { type: "image/jpeg" });
      formData.append("poster_file", fakeFile);

      await updateAnnouncement("existing-announcement-uuid", null, formData);

      // Verify old poster was deleted because we mapped from "old-poster.png" to new poster
      expect(mockSupabaseRemove).toHaveBeenCalledWith(["old-poster.png"]);
    });

    it("correctly cleans up storage poster file when announcement is deleted", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "existing-announcement-uuid", title_bm: "Tajuk Asal", status: "DRAFT", poster_path: "old-poster.png" },
        error: null,
      });

      await deleteAnnouncement("existing-announcement-uuid");

      // Verify that delete storage removal was triggered for old-poster.png
      expect(mockSupabaseRemove).toHaveBeenCalledWith(["old-poster.png"]);
    });
  });

  // D. Unauthorized Mutation Attempts Tests
  describe("Unauthorized mutation attempts", () => {
    it("rejects creation if user is not ADMIN", async () => {
      mockGetAdminState.mockResolvedValue({ status: "forbidden", email: "student@test.com" });

      const formData = new FormData();
      formData.append("title_bm", "Tajuk BM");
      formData.append("title_en", "Title EN");
      formData.append("body_bm", "Kandungan BM");
      formData.append("body_en", "Kandungan EN");
      formData.append("category", "Umum");
      formData.append("status", "DRAFT");

      const result = await createAnnouncement(null, formData);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Akses dinafikan");
    });

    it("rejects edit if user is anonymous", async () => {
      mockGetAdminState.mockResolvedValue({ status: "anonymous" });

      const formData = new FormData();
      formData.append("title_bm", "Tajuk BM");
      formData.append("title_en", "Title EN");
      formData.append("body_bm", "Kandungan BM");
      formData.append("body_en", "Kandungan EN");
      formData.append("category", "Umum");
      formData.append("status", "DRAFT");

      const result = await updateAnnouncement("id-123", null, formData);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Akses dinafikan");
    });

    it("rejects deletion if user is anonymous", async () => {
      mockGetAdminState.mockResolvedValue({ status: "anonymous" });

      const result = await deleteAnnouncement("id-123");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Akses dinafikan");
    });
  });
});
