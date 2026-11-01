# Phase 5.2 — Sound Effects & Motion

## Scope

- Added a small Web Audio API sound engine that synthesizes short tones in the browser; no third-party audio files or external services are required.
- Added a persistent sound preference shared by practice and online play using the `guess-arena:sound` local-storage key.
- Added accessible sound on/off controls to both game modes.
- Practice mode feedback includes start, yes/no answers, manual elimination/restore, wrong guesses, and victory.
- Online play reacts to persisted room-action updates and plays yes/no, elimination, win/loss, and turn feedback where applicable.
- Added short card-entry, feedback, and active-turn animations.
- Existing `prefers-reduced-motion: reduce` rules disable or minimize motion for users who request reduced motion.

## Technical notes

- Sound generation is client-only through the browser's `AudioContext`; unavailable or blocked audio never interrupts a game action.
- Audio is primed from user interaction to comply with browser autoplay restrictions.
- The preference is stored locally per browser; it does not change another player's sound setting.
- No database migration or server API changes are required.
- Motion is presentation-only and does not alter server-authoritative game state or polling.

## Manual acceptance checklist

1. Open practice mode and start a round; confirm the start sound and sound toggle work.
2. Ask questions that return both Yes and No; confirm the different feedback tones.
3. Manually eliminate and restore cards; confirm the corresponding sounds and card transitions.
4. Make a wrong guess and then win a practice round; confirm distinct lose/win sounds.
5. In two-player online play, enable sound in both browsers and verify that each client hears question/answer and guess result feedback when the opponent acts.
6. Confirm the win sound plays on the winner's browser and loss sound on the other browser when a correct final guess ends the match.
7. Turn sound off, refresh, and confirm the preference remains off in both practice and online mode.
8. Enable the operating system/browser reduced-motion preference and confirm card and turn animations are minimized.
9. Confirm the game remains fully playable if browser audio is blocked or unavailable.
