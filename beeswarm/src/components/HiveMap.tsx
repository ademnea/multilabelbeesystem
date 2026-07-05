// Fallback barrel — Metro uses HiveMap.web.tsx on web and this on native.
// TypeScript resolves types from here; the correct platform implementation
// is selected automatically at bundle time.
export { default } from "./HiveMap.native";
export type { MapHive } from "./HiveMap.native";
