# BSADS Project Roadmap

Based on the Software Design Document (SDD v7.1) and current app state.

---

## Current State Summary

The mobile app has a working skeleton: auth screens, dashboard, hive list, hive details, alerts,
map, classification screen, and settings. All data is mocked locally. There is no backend
connection, no authentication logic, no push notifications, and no ML pipeline wired up.

---

## Suggested Changes (SDD Gap Analysis)

### Data Model Mismatches
| Gap | SDD Reference | Priority |
|-----|--------------|----------|
| `HiveStatus` type missing `"Uncertain"` state | SDD §2.3, §4.2.2 | High |
| User entity missing `role` field (Beekeeper / Researcher) | SDD Table 4.8 | Medium |
| Hive entity missing `hive_type`, `installation_date`, `owner_id` | SDD Table 4.9 | Medium |
| No `InferenceResult` fields exposed in UI (`confidence_score`, `inference_latency_ms`) | SDD Table 4.6 | High |
| No `FeatureVector` or spectrogram visualization | SDD Table 4.4, 4.7 | Low |
| Advisory actions lack status tracking UI (Pending / Completed) | SDD Table 4.12 | Medium |

### Mobile App Features Missing
| Feature | SDD Reference | Priority |
|---------|--------------|----------|
| Form validation on login and signup (required fields, email format, password rules) | SDD §6.2.1 | High |
| Auth token persistence and session restore on launch | SDD §2.4.4 | High |
| Hive registration / add-a-hive screen | SDD Table 4.9 | High |
| ML confidence score shown per hive in hive details | SDD Table 4.6 | High |
| Alert read/unread state and badge count on tab | SDD §6.2.3 | Medium |
| Historical acoustic activity chart in hive details | SDD §6.3 (f) | Medium |
| Spectrogram image viewer in hive details | SDD Table 4.7 | Low |
| User profile editing in settings | SDD §6.3 (h) | Medium |
| Notification preferences toggle in settings | SDD §6.3 (h) | Medium |
| Map: status-coloured hive pins, tap to open hive details | SDD §2.3 (v) | High |
| Offline cache of last-known dashboard and alerts | SDD §2.3 (vi) | Medium |
| Auto-sync when connectivity is restored | SDD §2.3 (vi) | Medium |
| Pull-to-refresh on all data screens | SDD §2.4.4 | Medium |
| Pagination for hives and alerts lists | SDD §2.4.1 | Medium |
| Push notifications for swarm/abscondment alerts | SDD §2.3 (iii) | High |
| Researcher role view with export / analytics access | SDD §2.4.2 | Low |

### Backend / Infrastructure Missing
| Item | SDD Reference | Priority |
|------|--------------|----------|
| Authentication API (register, login, token refresh) | SDD §3.1.2 | Critical |
| Real REST API connection for all screens | SDD §3.1.2 | Critical |
| Environment configs (dev / staging / prod) | SDD §2.4.3 | High |
| Cloud storage for audio files (URIs not blobs) | SDD §4.1 | High |
| ML inference pipeline deployment | SDD §3.1.4 | Critical |
| MFCC feature extraction service | SDD §5.1.2 | High |
| System monitoring and logging component | SDD §5.1.5 | Medium |
| Cloud synchronization component | SDD §5.1.4 | Medium |
| CI/CD pipeline and automated testing | SDD §2.5 (v) | Medium |

---

## Roadmap

### Phase 1 — Mobile Foundation (Weeks 1–2)

Core UX work that has no backend dependency.

- [ ] **Form validation** — Login and signup: required fields, email format, min password length, inline error messages, submit loading state
- [ ] **Auth persistence** — Store token securely with `expo-secure-store`; restore session on app launch; full logout clears token
- [ ] **Alert UX** — Unread/read state, badge count on Alerts tab, pull-to-refresh, auto-refresh on focus
- [ ] **Map pins** — Status-coloured markers (green = Healthy, orange = Pre-swarm, red = Swarm, grey = Abscondment); tap pin opens hive details
- [ ] **Pull-to-refresh** — Add to Dashboard, Hive List, and Alerts screens
- [ ] **Uncertain hive state** — Add `"Uncertain"` to `HiveStatus` type and handle it in status colours and labels across all screens

---

### Phase 2 — Data Model Alignment (Weeks 3–4)

Align the app's data shapes with the SDD entity tables.

- [ ] **Hive registration screen** — Form with `hive_id`, `hive_location`, `hive_type`, `installation_date`; POST to `/hives`
- [ ] **User profile in settings** — Show and edit `full_name`, `telephone_number`, `email`; display `role`
- [ ] **Notification preferences** — Toggle swarm/abscondment/warning alerts; store preference locally and sync to backend when available
- [ ] **Confidence score in hive details** — Show ML confidence score from `InferenceResult` alongside hive state label; surface a low-confidence warning if score < 0.6
- [ ] **Advisory action checklist** — Mark individual actions as Pending / Completed; persist status; show completion progress bar
- [ ] **Acoustic activity chart** — Add a third chart series in hive details for acoustic signal energy alongside the existing temperature and humidity charts

---

### Phase 3 — Backend Integration (Weeks 5–8)

Wire the app to real APIs. Replace all mock data calls progressively, screen by screen.

- [ ] **Authentication endpoints** — `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`; hook up to login and signup screens; propagate auth header to all API calls
- [ ] **Dashboard API** — Connect `fetchDashboard()` to live endpoint; validate response shape against `DashboardData` type
- [ ] **Hives API** — `GET /hives`, `GET /hives/:id`, `POST /hives`, `PUT /hives/:id`; add pagination support (`page`, `limit` query params)
- [ ] **Alerts API** — `GET /alerts`, `GET /alerts/:id`, `PATCH /alerts/:id/acknowledge`; paginate; wire up read/unread state
- [ ] **Advisory API** — `GET /alerts/:id/advisory`; `PATCH /advisory-actions/:id` for checklist status
- [ ] **Inference API** — `GET /hives/:id/inferences` for historical results; `GET /hives/:id/inferences/latest` for current state + confidence score
- [ ] **Environment configs** — `EXPO_PUBLIC_API_BASE_URL` per env; set up `.env.dev`, `.env.staging`, `.env.prod`

---

### Phase 4 — ML & Analytics Pipeline (Weeks 9–14)

Connect the intelligence layer. This phase is primarily backend/ML engineering.

- [ ] **Audio ingestion endpoint** — `POST /audio` accepting file URI + metadata; stores reference (not blob); validates format (WAV/MP3) and size
- [ ] **Preprocessing service** — Noise reduction → amplitude normalization → fixed-window segmentation; produces `SanitizedAudioMetadata`
- [ ] **Feature extraction service** — MFCC coefficients, spectral centroid, spectral bandwidth, signal energy, zero-crossing rate, normalized temperature/humidity; stores `FeatureVector`
- [ ] **ML inference service** — Load trained model; batch inference on feature vectors; produce `InferenceResult` with `hive_state`, `confidence_score`, `inference_latency_ms`
- [ ] **Alert generation logic** — Trigger alert when hive state is Pre-swarm, Swarm, or Abscondment; set severity based on state and confidence threshold
- [ ] **Advisory generation** — Rule-based advisory linked to `InferenceResult`; generate `Advisory` and `AdvisoryAction` checklist from detected hive state
- [ ] **Spectrogram generation** — Generate spectrogram image from audio segment; store URI in `ProcessedImage`; surface image in hive details screen
- [ ] **Model versioning** — Populate `ModelMetadata` entity; display model version and accuracy in the settings screen

---

### Phase 5 — Infrastructure & Production (Weeks 15–20)

Hardening, reliability, and shipping.

- [ ] **Push notifications** — Integrate `expo-notifications` + FCM (Android) / APNs (iOS); register device token on login; send notification on alert generation
- [ ] **Offline caching** — Cache last-known dashboard and alerts with `AsyncStorage`; serve stale data when offline; show "offline" banner
- [ ] **Auto-sync on reconnect** — Queue advisory action status changes and alert acknowledgments offline; flush queue on network restore using `NetInfo`
- [ ] **Cloud synchronization** — Scheduled sync of classification results and analytical summaries to cloud storage; encrypt before upload; log sync status
- [ ] **System monitoring & logging** — Structured logging for data ingestion, inference, and API access events; error reports; alert on critical failures
- [ ] **Role-based access** — Restrict data export and model metadata views to `Researcher` role; hide from `Beekeeper` role
- [ ] **CI/CD** — GitHub Actions: lint + type-check + test on PR; EAS Build for staging and production; env secrets management
- [ ] **QA & device testing** — Full regression on Android physical device; accessibility audit (tap targets, contrast, labels); performance profiling
- [ ] **App store preparation** — Final app icon, splash screen, store listing assets, privacy policy; Expo EAS submit

---

## Priority Summary

| Priority | Items |
|----------|-------|
| **Do first** (blocks everything) | Auth persistence, form validation, real API connection, ML inference service |
| **Do soon** (user-visible gaps) | Uncertain hive state, map pins, confidence score display, hive registration |
| **Do later** (enhances completeness) | Offline sync, push notifications, spectrogram viewer, researcher role |
| **Final stretch** (production readiness) | CI/CD, cloud sync, system monitoring, app store submission |
