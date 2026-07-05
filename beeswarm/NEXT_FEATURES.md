# Next Features

## 1. Real Form Logic
- Add login/signup validation (required fields, email format, password rules).
- Show inline field-level error messages.
- Add submit loading state and disable buttons while requests are in progress.

## 2. Authentication Integration
- Connect login/signup screens to backend endpoints.
- Persist auth token securely on device.
- Restore session on app launch and support full logout.

## 3. Backend Data Completion
- Ensure all screen APIs return production-ready data shapes:
  - Dashboard
  - Hives list
  - Hive details
  - Alerts list/details
- Add pagination for hives and alerts when datasets grow.

## 4. Real Map Integration
- Replace map placeholders with real map provider integration.
- Plot hives by coordinates.
- Use status-based pin colors (Healthy, Pre-swarm, Swarm, Abscondment).
- Open hive details from map pins.

## 5. Metrics Chart Upgrade
- Replace simple metric bars with a proper trend chart.
- Add time range filters (24h, 7d, 30d).

## 6. Alerts Workflow Polish
- Add unread/read state.
- Add filters (Critical, Warning, Info).
- Add alerts badge count on tab.
- Add pull-to-refresh and/or auto-refresh.

## 7. Navigation and UX Polish
- Add tab icons.
- Standardize headers and action buttons.
- Improve empty states and loading states.
- Add pull-to-refresh where applicable.

## 8. Accessibility and Mobile Readiness
- Ensure minimum tap target sizes.
- Improve color contrast for alert severities.
- Add accessibility labels for interactive controls.
- Improve keyboard handling on auth forms.

## 9. Offline and Error Handling
- Improve retry/fallback behavior for network failures.
- Add local cache for last known dashboard/hives data.

## 10. QA and Release Preparation
- Add component and screen-level tests.
- Run full device testing on Android.
- Finalize app icon, splash screen, and branding assets.
- Set up environment configs (dev/staging/prod).


# next ef
 integrating push with Expo Notifications + FCM/APNs.
phonenumbers
