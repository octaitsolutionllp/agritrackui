# AgriTrack UI

React Native (Expo) app for AgriTrack — helps individual farmers track crop/seed growth stages, log expenses per crop, see profit & loss, and get smart watering/pesticide reminders. Localized in English, Hindi and Marathi.

Companion repo: [agritrackapi](https://github.com/octaitsolutionllp/agritrackapi) (.NET 10 backend).

See [CLAUDE.md](CLAUDE.md) for the full architecture reference (project conventions, known web-platform quirks, etc.) — read it before making changes.

## Stack

- Expo SDK 57, JavaScript (no TypeScript)
- React Context for state (no Redux), Axios, React Navigation v7
- **Web is the current release target** — used on the phone via a mobile browser; native Android/iOS builds are planned from the same codebase later.

## Local setup

1. Install dependencies:
   ```
   npm install
   ```
2. Make sure the [agritrackapi](https://github.com/octaitsolutionllp/agritrackapi) backend is running locally (default `http://localhost:5012`) — update `src/config/api.js` if your API runs elsewhere.
3. Run for web:
   ```
   npx expo start --web
   ```

## Repo layout

```
App.js                    LanguageProvider > AuthProvider > AppNavigator
src/
  api/                    client.js (axios + bearer interceptor), one file per feature area
  components/             ScreenHeader, EmptyState, LoadingSpinner, StageProgressBar, ...
  config/api.js           API_BASE_URL
  context/                AuthContext.js, LanguageContext.js
  i18n/strings.js         en/hi/mr dictionaries, nested per screen
  navigation/AppNavigator.js
  screens/                one file per screen
  services/               reminderEngine.js, notifications.js
  theme/colors.js
  utils/storage.js        expo-secure-store wrapper (with web localStorage fallback)
wireframes/               original screen mockups (.dc.html canvas source)
```
