# LIFEHELP Part 2 — install notes

1. Supabase > SQL Editor > New query > paste `supabase/migrations/001_part2_schema.sql` > Run (once).
2. Copy the files in this zip into the repo, keeping the same paths (see list in chat), commit to `main`.
3. Wait for the GitHub Action to turn green, then open the Pages URL.

Replace (existing files): src/App.jsx, src/context/AuthContext.jsx, src/context/LanguageContext.jsx,
src/data/modules.js, src/lib/validators.js, src/components/ui/Select.jsx, src/pages/Emergency.jsx, src/pages/Profile.jsx
New: everything else. Optional: delete src/pages/ModulePlaceholder.jsx (no longer used).
