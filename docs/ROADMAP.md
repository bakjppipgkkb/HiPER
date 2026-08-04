# Delivery Roadmap

## Phase 1 — Site Settings
Build an admin form, validate the official email and multiline address, persist to `site_settings`, and render the same row in the footer.

## Phase 2 — Pengumuman
Build create/edit/publish/archive, one `poster_path`, Storage upload/replace/remove, public rendering and cache refresh.

## Phase 3 — Tabung Jumaat
Build admin Collection/Distribution records, public visibility, student amount submission, verified confirmation, Studio list and totals.

## Phase 4 — Organisasi
Build separate units, officers and assignments. The form must save normalized rows, not one fragile nested array.

## Phase 5 — iAset and Permohonan Saya
Add assets and loans with student ownership enforced by RLS. Avoid generic action names.

## Phase 6 — iKES
Add application types, proof storage, decisions, repayment status and privacy policies.

## Phase 7 — Migration and cutover
Validate v1 exports, import them once, freeze v1 writes, run acceptance tests and move the production domain.
