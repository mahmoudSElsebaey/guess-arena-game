# Phase 4 — Game Content Management

## Scope completed

- PostgreSQL is the runtime source for active characters and questions.
- `GET /api/game/content` returns active game content only.
- Practice mode and multiplayer lobby/game UI consume the database-backed content API.
- Multiplayer question evaluation and character validation are performed against active database content.
- `/[locale]/admin/content` provides a bilingual content studio for owners and administrators.
- The content studio manages categories, characters, and questions.

## Content operations

### Categories
- Create and edit Arabic/English names, slug, type, and display order.
- Archive/reactivate categories.
- Permanently delete only empty categories.
- Category type cannot be changed after creation.
- A category with active content cannot be archived.

### Characters
- Create and edit names, avatar emoji, category, sort order, and the complete supported attribute set.
- Archive/reactivate characters.
- Character records are not hard-deleted because old rooms and match actions may refer to their IDs.

### Questions
- Create and edit Arabic/English labels, category, attribute key, expected value, and sort order.
- Archive/reactivate questions.
- Expected values are validated against the selected attribute's allowed values.
- Question records are not hard-deleted because historical match actions may refer to their IDs.

## Safety rules

- Admin API checks the current database user role and status on every request; only active OWNER and ADMIN users are accepted.
- Player accounts receive 403 from the management API.
- Content writes are blocked while any room is IN_PROGRESS. This prevents the rules or character set from changing during a live match.
- Content categories are type-checked before assigning characters or questions.
- Duplicate category slugs are rejected.
- Archived records remain stored for historical integrity but are omitted from active gameplay.
- Secret character IDs remain private to their owning room member; the public content API contains only the public character catalog and attributes.

## Manual verification checklist

1. Sign in as OWNER or ADMIN and open `/ar/admin/content` and `/en/admin/content`.
2. Confirm the seeded 45 characters, 19 questions, and 4 categories appear.
3. Create a new character, edit its attributes, archive it, reactivate it, and confirm it appears/disappears in `/api/game/content`.
4. Create a question using a valid attribute/value pair, edit both translations, archive/reactivate it, and confirm it appears/disappears in the public content API.
5. Create and edit a category. Confirm an empty category can be deleted, but a category containing characters/questions cannot.
6. Attempt to archive a category with active content; the API must reject it.
7. Sign in as PLAYER and request `/api/admin/content`; expect HTTP 403.
8. Start a live match and attempt a content write; expect HTTP 409 with `ACTIVE_GAMES_RUNNING`.
9. Finish the match, then verify content edits work again.
10. Verify practice mode and a two-account online match still load the same active character and question set.

## Operational notes

- No new migration is required for this phase; it uses the existing `GameContentCategory`, `GameCharacter`, and `GameQuestion` schema.
- Seed files remain as the repeatable initial content source only. Runtime reads use PostgreSQL.
- Character and question IDs are preserved for the original seeded content. New records receive stable generated IDs.
