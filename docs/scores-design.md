# Scores in Tex Arcade

Reuse the current arcade and the existing Biomes / World Debugger runtime. No second game implementation. Keep its direct URL, seven original biomes, variants, perks, medals and saves.

The score room uses the arcade's midnight blue (#0d1821), deep navy (#081119), signal green (#39e072), purple (#9e42e7), chalk (#f7f6f6) and muted slate (#94a4b5). Use the existing Satoshi/system sans stack, large heavy headings, and tabular score numerals. Keep text left aligned. The primary visual is a spacious ranked list, beside a narrower account and personal-record panel; game selection runs across the top. On phones these stack into one column. Avoid a fabricated podium or example players. Empty/offline states explain how to play or reconnect. Motion responds to filters and selection, with reduced motion support.

The first sketch used five identical score cards. That obscured comparison and duplicated the arcade menu. The final design instead uses one ranked list with game tabs and a contrasting compact account panel, preserving the arcade palette and controls.

Backend contract was inspected directly on OpenClaw on 2026-10-16. Authentication uses server-issued Bearer sessions; a run must start before play and finish with a per-run HMAC-SHA256 proof. Public boards and character records come only from accepted backend runs. Historical device records are labelled separately and never uploaded as newly played runs. Pending finishes retain the original run identity and owner. They cannot be submitted under another account or to another API URL.
