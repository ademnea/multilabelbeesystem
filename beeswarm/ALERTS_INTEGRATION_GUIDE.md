# Classification Alerts Integration Guide

This guide shows how to integrate the prediction API and alerts into your Beeswarm app.

## Quick Start

The mock prediction API is ready to use. It simulates classification predictions that can trigger alerts.

### 1. Using the Debug Panel (For Testing)

Add the debug panel to your Dashboard screen to test alerts:

```tsx
import { ClassificationDebugPanel } from "./src/components/ClassificationDebugPanel";

function DashboardScreen() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  
  // Get hive IDs from your dashboard
  const hiveIds = dashboard?.hives?.map(h => h.id) || [];

  return (
    <ScrollView contentContainerStyle={styles.appPage}>
      {/* Your dashboard content */}
      
      {/* Add debug panel at the bottom */}
      <ClassificationDebugPanel 
        hiveIds={hiveIds} 
        visible={true} // Set to false to hide
      />
    </ScrollView>
  );
}
```

### 2. Using the Prediction Fetcher Hook (For Automatic Polling)

```tsx
import { usePredictionFetcher } from "./src/hooks/usePredictionFetcher";

function DashboardScreen() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const hiveIds = dashboard?.hives?.map(h => h.id) || [];

  // Setup automatic prediction fetching
  const { predictions, startFetching, stopFetching } = usePredictionFetcher({
    hiveIds,
    enabled: true,           // Auto-start fetching
    interval: 30000,         // Fetch every 30 seconds
    showAlerts: true,        // Show toast alerts
  });

  return (
    <ScrollView contentContainerStyle={styles.appPage}>
      {/* Your dashboard content */}
      
      {/* Optional: Display predictions */}
      <Text>Recent predictions: {predictions.length}</Text>
    </ScrollView>
  );
}
```

### 3. Manual Prediction Fetching

```tsx
import { getPrediction, getHivePredictions } from "./src/api/mockPredictionApi";
import { showClassificationAlert } from "./src/utils/alertNotification";

async function checkHive(hiveId: string) {
  try {
    const prediction = await getPrediction(hiveId);
    showClassificationAlert(prediction);
  } catch (error) {
    console.error("Failed to get prediction:", error);
  }
}
```

## Architecture

```
src/
├── api/
│   └── mockPredictionApi.ts      # Mock API (replace with real API later)
├── components/
│   └── ClassificationDebugPanel.tsx  # UI for testing
├── hooks/
│   ├── useClassificationAlerts.ts    # Direct alert simulation
│   └── usePredictionFetcher.ts       # Prediction fetching hook
└── utils/
    ├── sampleClassificationData.ts   # Sample data generator
    └── alertNotification.ts          # Toast alert display
```

## Classification Types

Available classifications:
- `HEALTHY` - Hive is operating normally
- `PRESSWARM` - Pre-swarm behavior detected (Warning)
- `SWARM` - Swarm event detected (Critical)
- `DISEASE` - Disease symptoms detected (Critical)
- `MITE_INFESTATION` - High mite levels (Warning)
- `QUEEN_LOSS` - Queen loss suspected (Critical)

## Migrating to Real API

When your model is ready, update `src/api/mockPredictionApi.ts`:

1. **Uncomment the real API code in the functions**
2. **Update the base URL:**

```typescript
const MOCK_API_CONFIG = {
  enabled: false,  // Switch to real API
  baseUrl: "https://your-api-endpoint.com", // Your API URL
  delayMs: 0,  // No delay needed
};
```

3. **Add authentication:**

```typescript
export async function getPrediction(
  hiveId: string,
  authToken: string
): Promise<ClassificationAlert> {
  const response = await fetch(
    `${MOCK_API_CONFIG.baseUrl}/api/v1/hives/${hiveId}/prediction`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  
  return response.json();
}
```

4. **The rest of your code stays the same** - no changes needed to components or hooks!

## Expected Response Format (Real API)

Your API should return predictions in this format:

```json
{
  "id": "alert_1234567890_abc123",
  "hiveId": "hive-1",
  "severity": "Critical",
  "title": "Swarm Alert",
  "message": "Swarm activity detected! Immediate action may be required.",
  "timestamp": "2026-04-20T10:30:00Z",
  "classification": "swarm"
}
```

## Testing Strategies

### Test 1: Direct Alerts
Use the "Generate Random Alert" button in the debug panel to trigger instant alerts.

### Test 2: Specific Classifications
Use the specific classification buttons (Healthy, Pre-swarm, Swarm) to test each alert type.

### Test 3: Continuous Polling
Enable "Start Polling Predictions" to continuously fetch predictions every 15 seconds.

### Test 4: Integration Test
Once real API is connected:
1. Disable mock API: `setMockApiEnabled(false)`
2. Start polling: `startFetching()`
3. Verify alerts appear for real predictions

## Toast Notifications

Alerts are displayed as toast notifications at the top of the screen:
- **Critical**: Red background, 5 second duration
- **Warning**: Orange background, 5 second duration  
- **Info**: Green background, 4 second duration

Customize in `src/utils/alertNotification.ts`

## Next Steps

1. ✅ Test with sample data (current)
2. ✅ Test debug panel buttons
3. ⬜ Implement real model API
4. ⬜ Update mockPredictionApi.ts with real endpoints
5. ⬜ Test with production data
6. ⬜ Remove ClassificationDebugPanel before release

