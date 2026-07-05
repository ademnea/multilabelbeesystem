# Suggested Changes (Now)

Based on gap analysis against SDD v7.1 and current app code.

---

## Priority Order

### 1. Form Validation — Login & Signup
**Effort: ~2 hours | Impact: Critical**

The login and signup buttons call `onAuthSuccess` directly with no validation. The
TextInputs have no `useState` — field values are never read.

Changes needed:
- Add `useState` for each field (`email`, `password`, `name`, `phone`, `confirmPassword`)
- Validate on submit: non-empty fields, valid email format, password ≥ 8 chars, passwords match on signup
- Show inline error messages under each failing field
- Disable the button and show a spinner during a future auth network call

---

### 2. Add `"Uncertain"` Hive State
**Effort: ~30 min | Impact: High**

The SDD defines 5 states: Normal, Pre-swarm, Swarm, Abscondment, **Uncertain**.
The app `HiveStatus` type only has 4. `STATUS_COLOR` is also defined **twice** in
`App.tsx` — once at module level with wrong colours, once inside `HivesListScreen`
with correct colours. Both are missing `Uncertain`.

Changes needed:
- Add `"Uncertain"` to the `HiveStatus` type in `beeswarmApi.ts`
- Add `Uncertain: "#6366F1"` to both `STATUS_COLOR` definitions
- Remove the duplicate module-level `STATUS_COLOR` and export/import the single correct one
- Add `"Uncertain"` to the map legend in `MapScreen`

---

### 3. Advisory Action Checkboxes
**Effort: ~1 hour | Impact: High**

Each advisory action currently shows text and a coloured priority dot — no way to
mark it done. The SDD (Table 4.12) defines `status: Pending | Completed` per action.
This is the core beekeeper decision-support loop.

Changes needed:
- Add `useState<Set<string>>` for completed action IDs in the alert details screen
- Replace the priority dot with a tappable checkbox icon (`checkmark-circle` / `ellipse-outline`)
- Strike through completed action text
- Show a progress counter: "2 / 4 completed"

---

### 4. Fix `severityColor` Function
**Effort: 5 min | Impact: High**

`severityColor` returns `THEME.accent` for both `Warning` and `Info`, so they look
identical. This affects every alert badge and pill in the app.

Fix:
```typescript
// App.tsx — severityColor()
function severityColor(severity: AlertSeverity): string {
  if (severity === "Critical") return "#DC2626";
  if (severity === "Warning") return "#D97706";
  return "#2563EB"; // Info
}
```

---

### 5. Pull-to-Refresh on Main Screens
**Effort: ~1 hour | Impact: Medium**

Dashboard, Hive List, and Alerts have no pull-to-refresh. The load callbacks
(`loadDashboard`, `loadHives`) already exist — it's just wiring them up.

Changes needed:
- Import `RefreshControl` from `react-native`
- Add `refreshing` state to Dashboard, HiveList, and AlertsList screens
- Pass `<RefreshControl refreshing={refreshing} onRefresh={...} />` to each `ScrollView`

---

### 6. Alert Unread/Read State + Tab Badge
**Effort: ~2 hours | Impact: Medium**

Alerts have no visual distinction between read and unread. `pendingAlerts` from
`DashboardData` is already fetched but never shown as a tab badge.

Changes needed:
- Add `tabBarBadge` to the Alerts tab using `dashboard.pendingAlerts` (when > 0)
- Add local `useState<Set<string>>` for read alert IDs
- Style unread alerts with a bolder left border or dot indicator
- Mark alert as read on open

---

## Suggested Schedule

| Day | Task |
|-----|------|
| 1 | Fix `severityColor` bug, add `Uncertain` state, consolidate `STATUS_COLOR` |
| 2 | Advisory action checkboxes |
| 3–4 | Form validation (login + signup) |
| 5 | Pull-to-refresh + alert tab badge |

---

## What to Defer

| Item | Reason |
|------|--------|
| Real backend / auth API | Do form validation first, then wire the endpoint |
| Offline sync | No value syncing mock data — do after real API is live |
| Push notifications | Do once auth and backend are stable |
| Spectrogram viewer | Needs ML pipeline to exist first |
