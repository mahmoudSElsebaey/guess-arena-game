# Phase 5.3 — Performance & Accessibility

## Performance improvements

- The practice board is loaded as a separate dynamic client chunk so the initial play page can render the header and online lobby first.
- Multiplayer polling was changed from a fixed 2-second loop to a visibility-aware 3-second loop.
- Refresh requests use an 8-second timeout and abort the previous request before starting a new one, preventing overlapping requests on slow connections.
- Practice content loading also uses an abortable 8-second timeout.
- Loading placeholders provide immediate visual feedback without blocking the page.

## Accessibility improvements

- Added a keyboard-visible skip link that jumps directly to the page's main content.
- Added main-content targets across the primary home, play, history, and admin pages.
- Added a keyboard-accessible mobile navigation menu with aria-expanded, aria-controls, and Escape-key closing.
- Added semantic labels to the online game and practice game regions.
- Loading states use role=status and aria-live=polite.
- Load failures use role=alert.
- Existing visible focus indicators and reduced-motion support are retained.

## Manual acceptance checklist

### Performance
1. Open the play page on a normal and throttled connection.
2. Confirm the page remains responsive while game content is loading.
3. Open a multiplayer room and leave the tab in the background for more than one polling cycle.
4. Return to the tab and confirm the match refreshes normally.
5. Confirm no gameplay action is blocked by an audio, loading, or polling failure.

### Accessibility
1. Press Tab immediately after page load and confirm the Skip to content link becomes visible.
2. Activate it and confirm focus moves to the page main content.
3. On a narrow screen, open the navigation with keyboard and close it with Escape.
4. Navigate all game buttons using keyboard only and confirm the focused control is clearly visible.
5. Use a screen reader, where available, to verify loading and error feedback is announced.
6. Enable reduced motion in the operating system and confirm transitions are minimized.

## Notes

These changes are presentation and client-performance improvements only. They do not change database schema, room permissions, turn validation, secret-character privacy, or server-authoritative game rules.
