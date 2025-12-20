# Agent Instructions

## Development Process
- FIRST think is there a need for larger refactoring or architecture change, and then how to implement based on principles from:
  - Code Complete by Steve McConnell
  - The Pragmatic Programmer by Hunt & Thomas
  - Inclusive Design Patterns by Heydon Pickering
  - The Web Application Hacker's Handbook
- NO CODE before test
- NO BUGFIX before regression test
- REFACTOR following clean code principles when tests pass
- UPDATE `CHANGELOG.md` for every user accepted feature/change
- BEFORE commit run 'npm run build'
- COMMIT with oneliner commit messages starting with verb, no coauthors

## Project
Development in `src/` folder. Run `npm run build` to generate single-file `TimerPie.html`.

## File Structure
- `src/index.html` - Development HTML (loads external CSS/JS)
- `src/css/style.css` - All styles
- `src/js/clock-logic.js` - Pure functions (testable, no side effects)
- `src/js/app.js` - State, UI, event handlers
- `TimerPie.html` - Generated release file (do not edit directly)
- `scripts/screenshots.sh` - Screenshot automation (Chrome headless + ImageMagick)

## Commands
```bash
npm run build            # Generate TimerPie.html from src/
npm test                 # Run tests (builds first, then tests TimerPie.html)
npm start                # Start local server at http://localhost:8080
./scripts/screenshots.sh # Regenerate documentation screenshots (requires npm start)
```

## Testing
Tests run against built `TimerPie.html`, not `src/` directly. The `pretest` hook rebuilds from src/ before each test run, so stale artifacts are not an issue. Always use `npm test`.

## Development
- **Local server**: `npm start` then open <http://localhost:8080>
- **File protocol**: Open `src/index.html` directly in browser (works for most features)

## Architecture
- `ClockLogic` object: pure functions (parsing, rendering math, cookies, URL hash)
- `state` object: mutable app state (color, mode, remaining, running, etc.)
- `el` object: cached DOM element references

## Key Patterns
- Persist preference: `setCookie`/`getCookie` + add to `parseHash`/`updateHash` whitelist
- New UI control: Add HTML → add to `el` → add event listener → add `title` tooltip → add `aria-label`
