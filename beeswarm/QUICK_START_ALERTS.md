# Quick Start: Classification Alerts

## ⚡ 30-Second Setup

### 1. Add to Your Dashboard (or any screen)

```tsx
import { ClassificationDebugPanel } from "./src/components/ClassificationDebugPanel";

// Inside your component:
<ClassificationDebugPanel 
  hiveIds={["hive-1", "hive-2", "hive-3"]} 
  visible={true}
/>
```

### 2. Done! 

Click buttons to test:
- ✅ "Generate Random Alert" → See toast notification
- ✅ "Fetch All Predictions" → Get mock predictions
- ✅ "Start Polling" → Auto-fetch every 15 seconds

---

## 🎯 What You Can Do Now

### Test Alert Display
```tsx
import { showAlert } from "./src/utils/alertNotification";

showAlert(
  "Pre-swarm Detected",
  "Hive-1 showing swarm preparation signs",
  "Warning"
);
```

### Get Sample Predictions
```tsx
import { getPrediction } from "./src/api/mockPredictionApi";

const prediction = await getPrediction("hive-1");
// Returns: ClassificationAlert with title, message, severity, etc.
```

### Auto-Poll Predictions
```tsx
import { usePredictionFetcher } from "./src/hooks/usePredictionFetcher";

const { predictions, startFetching } = usePredictionFetcher({
  hiveIds: ["hive-1", "hive-2"],
  enabled: true,
  interval: 30000,
  showAlerts: true,
});
```

---

## 🔄 When Real API is Ready

1. Update `src/api/mockPredictionApi.ts` → Replace mock code with real API calls
2. Change config: `enabled: false`
3. Add auth token to function calls
4. Everything else stays the same! ✨

---

## 📋 Classification Types (Sample Data)

- 🟢 **HEALTHY** - Normal operation
- 🟡 **PRESSWARM** - Warning: pre-swarm behavior
- 🔴 **SWARM** - Critical: swarm detected
- 🔴 **DISEASE** - Critical: disease symptoms
- 🟡 **MITE_INFESTATION** - Warning: high mites
- 🔴 **QUEEN_LOSS** - Critical: queen suspected lost

---

## 📁 File Structure

```
src/
├── api/mockPredictionApi.ts          ← Replace with real API
├── hooks/usePredictionFetcher.ts      ← Use this hook
├── utils/alertNotification.ts         ← Show alerts
├── utils/sampleClassificationData.ts  ← Sample data
└── components/ClassificationDebugPanel.tsx ← Testing UI
```

---

## 🧪 Test Cases

| Test | Button | Expected |
|------|--------|----------|
| Simple alert | "Generate Random Alert" | Toast appears at top |
| Specific type | "Get Swarm Prediction" | Red critical alert |
| Auto-polling | "Start Polling" | Alerts every 15s |
| Manual fetch | "Fetch All Predictions" | 1-3 alerts appear |

---

## ❓ Common Questions

**Q: How do I hide the debug panel?**
```tsx
<ClassificationDebugPanel hiveIds={hiveIds} visible={false} />
```

**Q: How do I change polling interval?**
```tsx
const { startFetching } = usePredictionFetcher({
  interval: 60000, // 60 seconds
});
```

**Q: How do I switch to real API?**
```typescript
// In mockPredictionApi.ts:
const MOCK_API_CONFIG = {
  enabled: false,  // ← Change this
  baseUrl: "https://your-api.com",
};
```

**Q: Do I need to change component code?**
No! All components use the same interface. Just swap the API implementation.

---

## 📚 See Also

- `ALERTS_INTEGRATION_GUIDE.md` - Full integration guide
- `API_CONTRACT.md` - Real API specification
- `src/examples/IntegrationExamples.tsx` - Code examples

