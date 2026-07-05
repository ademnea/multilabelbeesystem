# beeswarm

BSADS focuses on bee swarm and abscondment prevention/detection, helping beekeepers monitor hive health from mobile.

## Mobile App Setup

1. Install dependencies:

```bash
npm install
```

2. Set backend API base URL for Expo:

PowerShell:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://YOUR_BACKEND_HOST:PORT"
```

3. Start the app:

```bash
npm run start
```

## Navigation

The app now uses React Navigation with:

- Auth stack: Welcome, Login, Signup
- Bottom tabs (after auth): Dashboard, Hives, Map

## Backend API Contract

The mobile app calls these endpoints using `EXPO_PUBLIC_API_BASE_URL`.

### `GET /dashboard`

Expected JSON (snake_case or camelCase both supported):

```json
{
	"totalHives": 12,
	"activeHives": 10,
	"statusCounts": {
		"Healthy": 8,
		"Pre-swarm": 2,
		"Swarm": 1,
		"Abscondment": 1
	},
	"keyMetrics": {
		"temperatureC": 34.5,
		"humidityPercent": 68,
		"populationKBees": 120,
		"nectarFlowKgPerDay": 1.2
	}
}
```

### `GET /hives?search=<query>`

Expected JSON array:

```json
[
	{ "id": "Hive A01", "status": "Healthy" },
	{ "id": "Hive A02", "status": "Pre-swarm" }
]
```

Supported status values:

- `Healthy`
- `Pre-swarm`
- `Swarm`
- `Abscondment`

The client normalizes common variants such as `normal`, `preswarm`, and `pre_swarm`.

### `GET /hives/:id`

Expected JSON for the hive detail screen:

```json
{
	"id": "Hive A02",
	"name": "Hive A02",
	"location": "North Yard",
	"status": "Pre-swarm",
	"alertTitle": "Pre-swarm risk",
	"alertMessage": "Hive activity requires attention.",
	"metrics": [18, 22, 28, 30, 35, 40, 47],
	"mapLabel": "Hive A02",
	"acknowledged": false
}
```

### `POST /hives/:id/acknowledge`

Marks the hive alert as acknowledged.

The app will also work without this endpoint during early development by using local fallback detail data when `EXPO_PUBLIC_API_BASE_URL` is unset.

### `GET /alerts`

Expected JSON array for recent alerts:

```json
[
	{
		"id": "ALT-001",
		"hiveId": "Hive A04",
		"severity": "Critical",
		"title": "Swarming risk detected",
		"date": "2026-04-09",
		"summary": "Rapid population rise and high queen cell activity."
	}
]
```

### `GET /alerts/:id`

Expected JSON for alert detail:

```json
{
	"id": "ALT-001",
	"hiveId": "Hive A04",
	"severity": "Critical",
	"title": "Swarming risk detected",
	"time": "2026-04-09 14:12",
	"details": "Multiple swarm indicators detected in recent readings.",
	"acknowledged": false
}
```

### `POST /alerts/:id/acknowledge`

Marks an alert as acknowledged from the alert detail screen.
