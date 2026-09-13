# AgriTrack

An app that helps individual farmers track crop/seed growth stages, log expenses per crop, see profit & loss, and get smart watering/pesticide reminders. Two independent projects live in this folder:

- **`API/`** — .NET 10 Web API backend
- **`UI/`** — React Native (Expo) app. **Release sequencing (as of 2026-09-13): web is the first release target** — used on the phone via a mobile browser — with native Android/iOS app builds to follow later from the same codebase. This reverses the original "mobile-only, no web" decision; `app.json`'s `platforms` array includes `"web"` for real now, not just as a dev-preview convenience.
- **`wireframes/`** — Claude Design canvas source (`.dc.html` files) for the original screen mockups

This is a standalone product — not part of, and not deployed alongside, the neighboring Billing System repo. It reuses that repo's proven patterns (RN app structure from `octa-inventory`, Dapper/stored-procedure discipline from `billingsystemnewapi`) but is otherwise fully independent.

## Architecture decisions (deliberate, don't "fix" without asking)

- **Database**: a **separate local SQL Server database named `agritrack`** (not the Billing System's own DB), on the same local instance: `Server=DESKTOP-M83IC3O\SQLEXPRESS17`. All AgriTrack objects live under a schema named **`agritrack`** — never `dbo`.
- **No Entity Framework, no inline SQL.** Every query is a stored procedure under `agritrack` (see `API/database/003_procs/`), called via Dapper with `CommandType.StoredProcedure` through `AgriTrack.Infrastructure.IStoredProcRepository`.
- **All primary keys and foreign keys are GUIDs** (`UNIQUEIDENTIFIER`), generated in the application layer (`Guid.NewGuid()`) before insert — not `int`/`bigint` identity columns.
- **Clean Vertical Slice Architecture, no MediatR.** Each use case is a self-contained folder under `AgriTrack.Application/Features/<Area>/<UseCase>/` with its own `Request`, `Handler` (plain class, constructor-injected), and `Endpoint` (a `Map...Endpoint(this IEndpointRouteBuilder)` extension called from `EndpointMapping.cs`). **Minimal APIs only — no Controllers.**
- **Auth**: standard ASP.NET Core JWT Bearer (`AddJwtBearer` + `.RequireAuthorization()` per endpoint). JWT carries the user's GUID in `ClaimTypes.NameIdentifier` and `preferred_language` claim; `AgriTrack.Application.Common.CurrentUser` resolves both from `ClaimsPrincipal`. No tenant/`idClient`/role concept — every user only ever sees their own data, filtered by `UserId`.
- **Dapper does not auto-handle `DateOnly`** in the version pinned here (2.1.66) — `AgriTrack.Infrastructure.DapperTypeHandlers.Register()` (called once at the top of `Program.cs`) registers custom handlers for `DateOnly`/`DateOnly?`. If a new date-typed proc parameter or result column starts throwing "cannot be used as a parameter value" or a constructor-matching error, this is the first place to check — don't reach for `DateTime` as a workaround, keep `DateOnly` in the domain model.
- **DB change workflow**: script every schema/proc change under `API/database/`, run and verify against the local `agritrack` DB first (via `sqlcmd`), before any production database gets it applied manually. Production DB placement (own Azure SQL DB vs. a second DB on the existing Billing System server) was deliberately left undecided — ask before assuming either.
- **Localization**: English/Hindi/Marathi. The `User.PreferredLanguage` column and JWT claim are the source of truth; the RN app's `i18n/strings.js` dictionaries were seeded from the wireframes' own per-screen `STRINGS` objects — extend those, don't re-translate from scratch.
- **Smart reminders are rule-based, not just user-scheduled.** `agritrack.CropTypes` stores per-crop, per-stage watering/pesticide intervals as JSON (`WaterIntervalDaysJson`, `PesticideIntervalDaysJson`); `agritrack.Sp_GetDueReminders` computes due dates from the crop cycle's current stage + last logged activity date. A stage with no interval entry in the JSON simply gets no reminder for that care type — this is intentional (e.g. no pesticide reminder during "Sowing").
- **Crop cycles start at `LandPreparation` (मशागत)**, before `Sowing` — added because it's a universal pre-sowing step for every crop. The full sequence: LandPreparation → Sowing → Germination → Vegetative → Flowering → Fruiting → Harvested (`Sp_AdvanceCropCycleStage`, `StageProgressBar.js`'s `STAGES` array — keep both in sync if the sequence ever changes).
- **Ratoon/multi-cycle crops** (e.g. sugarcane's Lagwad → Khodva 1 → Khodva 2, or repeat flower flushes): `CropCycles.CycleLabel` (free text), `ParentCropCycleId`, and a denormalized `RootCropCycleId` (every cycle in a lineage shares the same root, resolved once at creation via `Sp_CreateCropCycle` rather than walked recursively) support this. `Sp_GetCycleLineage` returns the whole family with lifetime P&L; the UI's "Start Next Cycle" button auto-suggests the next label.
- **A logged Activity's optional `Cost` counts as an expense automatically** — `Sp_GetPnlByCropCycle`/`Sp_GetPnlSummaryByUser`/`Sp_GetPnlByCropForUser`/`Sp_GetExpenseCategoryBreakdown` all sum `Activities.Cost` (where not null) alongside the `Expenses` table, mapped to a matching category (Water→Irrigation, Weeding/EarthingUp/Sieving→Labor, etc. — see the `CASE` in `Sp_GetExpenseCategoryBreakdown`). Never re-total from `Expenses` alone or activity costs will silently go missing from reports; the Expenses screen's total comes from `Sp_GetPnlByCropCycle`, not a local sum of the list, for exactly this reason.
- **Users pick which crops they grow** (`agritrack.UserCropTypes`, a join table) — the "Start Crop Cycle" picker calls `Sp_GetMyCropTypes`, which returns only the user's selection, falling back to *every* crop type if they haven't picked any yet (empty selection is a valid, deliberate "show all" state, distinct from `Users.HasCompletedCropSelection` which just gates whether the onboarding screen is shown again). `SelectCropsScreen.js` is reused for both first-run onboarding (gated in `AppNavigator.js` — shown instead of the tab navigator until the flag is true) and later editing from Profile → "My Crops".

## Repo layout

```
agri-mob-app/
  API/
    AgriTrack.slnx
    src/
      AgriTrack.Api/            host: Program.cs, appsettings*.json
      AgriTrack.Domain/         Entities/ (plain POCOs, GUID keys)
      AgriTrack.Application/    Features/<Area>/<UseCase>/, Common/ (CurrentUser, JwtTokenGenerator), EndpointMapping.cs, ServiceCollectionExtensions.cs
      AgriTrack.Infrastructure/ DbConnectionFactory, DapperStoredProcRepository, StoredProcedures.cs (schema-qualified name constants), DateOnlyTypeHandler.cs
    database/
      001_schema/    CREATE SCHEMA agritrack
      002_tables/    one file per table
      003_procs/     one file per stored procedure
      004_seed/      CropTypes seed data — 29 crop types covering Maharashtra's major cereals, pulses, oilseeds, vegetables, fruits and spices
  UI/
    App.js                    LanguageProvider > AuthProvider > AppNavigator
    src/
      api/                    client.js (axios + bearer interceptor), one file per feature area
      components/             ScreenHeader, EmptyState, LoadingSpinner, StageProgressBar, PnlCard, ExpensePieChart, LanguagePicker
      config/api.js           API_BASE_URL (10.0.2.2 for Android emulator, localhost for iOS sim — update for a real device)
      context/                AuthContext.js, LanguageContext.js
      i18n/strings.js         en/hi/mr dictionaries, nested per screen — extend here, not inline in screens
      navigation/AppNavigator.js   bottom tabs (Dashboard/Farms/CropCycles/Reminders/Reports) + stack (CropCycle detail, Expenses, LogActivity modal)
      screens/                one file per screen, matches wireframes/*.dc.html 1:1
      services/               reminderEngine.js (pulls agritrack.Sp_GetDueReminders, schedules expo-notifications), notifications.js
      theme/colors.js
      utils/storage.js        expo-secure-store wrapper
  wireframes/         .dc.html screen mockups + canvas.json
```

### UI notes
- Expo SDK 57 (latest at scaffold time — plan referenced SDK 55 from `octa-inventory`, but there was no reason to pin to an older SDK for a brand-new app).
- **Web is the active target for now** (see release sequencing above) — don't spend time driving Android emulators/iOS simulators/physical-device testing until asked again; verify changes via `expo start --web` / `expo export --platform web` instead.
- **Known web limitations to flag when relevant, not silently work around**: `expo-notifications` (the reminder engine's local scheduling) has effectively no working implementation in a plain mobile browser tab — no service worker/push setup exists, and iOS Safari in particular won't deliver background notifications outside an installed PWA. Reminders still compute and display correctly in-app (`/api/reports/reminders`, the Dashboard/Reminders screens); only the "notify me even when the app is closed" behavior is native-app-only for now. `expo-secure-store` has a `localStorage` fallback for web (see `utils/storage.js`) so auth/session persistence does work in the browser.
- No `idClient`/tenant/role logic anywhere (unlike `octa-inventory`) — the JWT's user id is the only scoping key, enforced server-side.
- Reminder "Snooze" is a client-only, non-persisted dismissal for the current session (no backend snooze concept yet) — "Mark Done" instead deep-links into `LogActivityScreen` pre-filled with the reminder's activity type, which naturally clears the due reminder once a fresh activity is logged.
- Every screen is wrapped in `components/Screen.js` (a `SafeAreaView` from `react-native-safe-area-context`, `edges={['top']}`) so headers/buttons clear the iOS notch and Android status bar — a plain `View`/`ScrollView` doesn't account for safe-area insets on its own. Use it for any new screen too.
- Tab bar icons come from `@expo/vector-icons` (`Ionicons`), wired in `AppNavigator.js`'s `TAB_ICONS` map — without an explicit `tabBarIcon`, React Navigation renders an unstyled placeholder glyph, which is what prompted adding these.
- Verified end-to-end: `dotnet build` (API), a full HTTP smoke test of every endpoint against the local `agritrack` DB, and `npx expo export --platform android`/`--platform web` (both compile cleanly). Login screen's language picker and account's saved `PreferredLanguage` were previously conflated — login no longer overwrites the locally-selected language, only registration seeds it (see `AuthContext.js`'s `persistSession`).
- **A conditionally-swapped `Stack.Navigator` branch (auth gate, onboarding gate, etc.) must never reuse a route name that also exists in another branch.** If it does, React Navigation just keeps showing the already-focused screen when the branch list changes underneath it, instead of falling back to the new branch's initial route — it looks exactly like "Save/Skip did nothing" even though the underlying state update and API call both succeeded (this bit the crop-selection onboarding gate: the onboarding-only branch and the main-app branch both had a `"SelectCrops"` screen; renaming the onboarding one to `"OnboardingCropSelection"` fixed it, matching how `"Login"` already disappears cleanly when `token` first appears in `AppNavigator.js`). A `key` prop on the `Stack.Navigator` to force a remount does *not* reliably work around this — don't reach for it.
- Bottom tab bar (`AppNavigator.js`'s `HomeTabs`) needs generous height/line-height for Devanagari labels — Marathi/Hindi glyphs run taller than Latin text at the same font size, and a tab bar sized only for English clips or fully hides the label text. Current sizing (`height: 70 + insets.bottom`, `tabBarLabelStyle.lineHeight: 14`) via `useSafeAreaInsets()` is the verified-working baseline; don't shrink it without re-testing all three languages.

## Local dev

- API connection string: `API/src/AgriTrack.Api/appsettings.Development.json` → `ConnectionStrings:AgriTrack` (points at local `agritrack` DB, `sa`/`sa123`).
- Run API: `dotnet run --project API/src/AgriTrack.Api` (default: `http://localhost:5012`).
- Apply a new DB script: `sqlcmd -S 'DESKTOP-M83IC3O\SQLEXPRESS17' -U sa -P sa123 -d agritrack -C -i path\to\script.sql`.
- To add a new stored procedure: use `CREATE OR ALTER PROCEDURE agritrack.Sp_...` (idempotent, safe to re-run), add its name to `StoredProcedures.cs`, and add a `.sql` file under `API/database/003_procs/`.
