# v1 Migration Boundary

## Reuse
- approved branding and logo assets;
- bilingual copy after review;
- valid business rules;
- validated historical records and media.

## Do not reuse
- Apps Script action router;
- Google Sheets as the live database;
- `demo-store` or mock production fallback;
- static JSON as live CMS data;
- the monolithic `AdminStudio.tsx` structure;
- `attachment_url` and `image_url` competing poster fields;
- old LFX environment names and routes.

Historical data should be exported to CSV/JSON, validated, transformed and imported with a one-time migration script. Do not make v1 and v2 write to the same records simultaneously.
