// gesture-handler MUST be the very first import in the entry file
import "react-native-gesture-handler";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, AppState, Platform, View, Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import { Asset } from "expo-asset";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  useNavigation,
} from "@react-navigation/native";
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from "@expo-google-fonts/inter";
import {
  BeekeeperProfile,
  fetchAlerts,
  initAuthFromStorage,
  logout,
  setUnauthorizedHandler,
} from "./src/api";
import { processQueue } from "./src/api/utils/offlineQueue";
import * as Network from "expo-network";
import { HeaderOverflowMenu } from "./src/components/HeaderOverflowMenu";
import { OfflineBanner } from "./src/components/OfflineBanner";
import { applyThemeMode, THEME } from "./src/theme";
import { useNotifications } from "./src/hooks/useNotifications";
import * as Notifications from "expo-notifications";

// Navigation types
import {
  RootStackParamList,
  MainTabParamList,
  HivesStackParamList,
  AlertsStackParamList,
} from "./src/navigation/types";

function NotificationHandler() {
  const responseListener = useRef<Notifications.Subscription>();
  const navigation = useNavigation();

  useEffect(() => {
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as any;
      
      if (data.type === 'alert' && data.alertId) {
        (navigation as any).navigate('Alerts', {
          screen: 'AlertDetails',
          params: { alertId: data.alertId }
        });
      } else if (data.hiveId) {
        (navigation as any).navigate('Hives', {
          screen: 'HiveDetails',
          params: { hiveId: data.hiveId }
        });
      }
    });

    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [navigation]);

  return null;
}

// Screens
import { WelcomeScreen } from "./src/screens/welcome/WelcomeScreen";
import { LoginScreen } from "./src/screens/auth/LoginScreen";
import { SignupScreen } from "./src/screens/auth/SignupScreen";
import { SettingsScreen } from "./src/screens/settings/SettingsScreen";
import { ProfileScreen } from "./src/screens/profile/ProfileScreen";
import { DashboardScreen } from "./src/screens/dashboard/DashboardScreen";
import { HivesListScreen } from "./src/screens/hives/list/HivesListScreen";
import { HiveDetailsScreen } from "./src/screens/hives/details/HiveDetailsScreen";
import { CreateHiveScreen } from "./src/screens/hives/create/CreateHiveScreen";
import { EditHiveScreen } from "./src/screens/hives/edit/EditHiveScreen";
import { AlertsListScreen } from "./src/screens/alerts/list/AlertsListScreen";
import { AlertDetailsScreen } from "./src/screens/alerts/details/AlertDetailsScreen";
import { MapScreen } from "./src/screens/map/MapScreen";

const PREF_DARK_MODE = "@bsads/dark_mode";

const APP_COLORS = {
  light: {
    page: THEME.page,
    surface: "#FFFFFF",
    text: THEME.text,
    primary: THEME.primary,
    muted: "#8A97A8",
    border: THEME.line,
    statusBar: "dark" as const,
  },
  dark: {
    page: "#0B1220",
    surface: "#111827",
    text: "#F3F4F6",
    primary: "#FFB268",
    muted: "#94A3B8",
    border: "#1F2937",
    statusBar: "light" as const,
  },
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const HivesStack = createNativeStackNavigator<HivesStackParamList>();
const AlertsStack = createNativeStackNavigator<AlertsStackParamList>();

function getInitialWebPath(): string {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return "";
  }

  const path = window.location.pathname.replace(/\/$/, "");
  return path || "/";
}

function getInitialTabRoute(path: string): keyof MainTabParamList {
  switch (path) {
    case "/app":
    case "/app/dashboard":
      return "Dashboard";
    case "/app/hives":
    case "/hives":
      return "Hives";
    case "/app/alerts":
    case "/alerts":
      return "Alerts";
    case "/app/map":
    case "/map":
      return "Map";
    case "/app/profile":
    case "/profile":
      return "Profile";
    default:
      return "Dashboard";
  }
}

function getInitialAuthRoute(path: string): keyof RootStackParamList {
  switch (path) {
    case "/login":
      return "Login";
    case "/signup":
      return "Signup";
    case "/welcome":
      return "Welcome";
    default:
      return "Welcome";
  }
}

const linking = {
  prefixes: ["http://localhost:8081", "http://localhost:8081/"],
  config: {
    screens: {
      Welcome: "welcome",
      Login: "login",
      Signup: "signup",
      MainTabs: {
        path: "app",
        screens: {
          Dashboard: "",
          Hives: "hives",
          Alerts: "alerts",
          Map: "map",
          Profile: "profile",
        },
      },
      Settings: "settings",
    },
  },
};

// ─── Sub-navigators ────────────────────────────────────────────────────────────

function HivesStackScreen({
  onOpenSettings,
  onLogout,
  currentUser,
  isDarkMode,
}: {
  onOpenSettings: () => void;
  onLogout: () => void;
  currentUser: BeekeeperProfile | null;
  isDarkMode: boolean;
}) {
  const colors = isDarkMode ? APP_COLORS.dark : APP_COLORS.light;
  return (
    <HivesStack.Navigator
      {...({
        screenOptions: {
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "800" },
          headerRight: () => (
            <HeaderOverflowMenu
              onOpenSettings={onOpenSettings}
              onLogout={onLogout}
            />
          ),
        },
      } as any)}
    >
      <HivesStack.Screen
        name="HiveList"
        component={HivesListScreen}
        options={{ title: "All Hives" }}
      />
      <HivesStack.Screen
        name="HiveDetails"
        component={HiveDetailsScreen}
        options={({ route, navigation }) => ({
          title: "Hive Details",
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Pressable
                onPress={() => navigation.navigate("EditHive", { hiveId: route.params.hiveId })}
                style={{ padding: 8 }}
              >
                <Ionicons name="pencil" size={20} color={colors.primary} />
              </Pressable>
              <HeaderOverflowMenu
                onOpenSettings={onOpenSettings}
                onLogout={onLogout}
              />
            </View>
          ),
        })}
      />
      <HivesStack.Screen
        {...({
          name: "CreateHive",
          options: { title: "Create Hive" },
          children: (props: any) => (
            <CreateHiveScreen {...props} currentUser={currentUser} />
          ),
        } as any)}
      />
      <HivesStack.Screen
        name="EditHive"
        component={EditHiveScreen}
        options={{ title: "Edit Hive" }}
      />
    </HivesStack.Navigator>
  );
}

function AlertsStackScreen({
  onOpenSettings,
  onLogout,
  onAlertOpened,
  isDarkMode,
}: {
  onOpenSettings: () => void;
  onLogout: () => void;
  onAlertOpened: () => void;
  isDarkMode: boolean;
}) {
  const colors = isDarkMode ? APP_COLORS.dark : APP_COLORS.light;
  return (
    <AlertsStack.Navigator
      {...({
        screenOptions: {
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "800" },
          headerRight: () => (
            <HeaderOverflowMenu
              onOpenSettings={onOpenSettings}
              onLogout={onLogout}
            />
          ),
        },
      } as any)}
    >
      <AlertsStack.Screen
        {...({
          name: "AlertsList",
          options: { title: "Recent Alerts" },
          children: (props: any) => (
            <AlertsListScreen
              {...props}
              route={{ ...props.route, params: { onAlertOpened } }}
            />
          ),
        } as any)}
      />
    
      <AlertsStack.Screen
        name="AlertDetails"
        component={AlertDetailsScreen}
        options={({ navigation }) => ({
          title: "Alert Details",
          headerLeft: () => (
            <Pressable onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -4 }}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
          ),
        })}
      />
    </AlertsStack.Navigator>
  );
}

function MainTabsScreen({
  navigation,
  onLogout,
  currentUser,
  onProfileUpdate,
  isDarkMode,
  initialTabRoute,
}: NativeStackScreenProps<RootStackParamList, "MainTabs"> & {
  onLogout: () => void;
  currentUser: BeekeeperProfile | null;
  onProfileUpdate: (user: BeekeeperProfile) => void;
  isDarkMode: boolean;
  initialTabRoute: keyof MainTabParamList;
}) {
  const openSettingsPage = () => (navigation as any).navigate("Settings");
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);
  const colors = isDarkMode ? APP_COLORS.dark : APP_COLORS.light;

  useEffect(() => {
    void fetchAlerts()
      .then((alerts) => {
        const unread = alerts.filter((a) => a.alertStatus === "pending");
        setUnreadAlertCount(unread.length);
      })
      .catch(() => {});
  }, []);

  // Called each time a single alert detail screen is opened
  const handleAlertOpened = () => {
    setUnreadAlertCount((c) => Math.max(0, c - 1));
  };

  return (
    <Tab.Navigator
      {...({
        initialRouteName: initialTabRoute,
        screenOptions: {
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "800" },
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "700",
            includeFontPadding: false,
          },
          tabBarIconStyle: { marginBottom: 2 },
          tabBarItemStyle: {
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
          },
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: Platform.OS === "ios" ? 85 : 70,
            paddingBottom: Platform.OS === "ios" ? 20 : 10,
            paddingTop: 8,
          },
          tabBarActiveTintColor: "#FFB268",
          tabBarInactiveTintColor: colors.muted,
          headerRight: () => (
            <HeaderOverflowMenu
              onOpenSettings={openSettingsPage}
              onLogout={onLogout}
            />
          ),
        },
      } as any)}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: "Dashboard",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        {...({
          name: "Hives",
          options: {
            headerShown: false,
            title: "Hive Management",
            tabBarLabel: "Hives",
            unmountOnBlur: true,
            tabBarIcon: ({ color, size, focused }: any) => (
              <Ionicons
                name={focused ? "grid" : "grid-outline"}
                size={size}
                color={color}
              />
            ),
          },
          children: () => (
            <HivesStackScreen
              onOpenSettings={openSettingsPage}
              onLogout={onLogout}
              currentUser={currentUser}
              isDarkMode={isDarkMode}
            />
          ),
        } as any)}
      />
      <Tab.Screen
        {...({
          name: "Alerts",
          options: {
            headerShown: false,
            tabBarLabel: "Alerts",
            tabBarBadge: unreadAlertCount > 0 ? unreadAlertCount : undefined,
            tabBarIcon: ({ color, size, focused }: any) => (
              <Ionicons
                name={focused ? "notifications" : "notifications-outline"}
                size={size}
                color={color}
              />
            ),
          },
          children: () => (
            <AlertsStackScreen
              onOpenSettings={openSettingsPage}
              onLogout={onLogout}
              onAlertOpened={handleAlertOpened}
              isDarkMode={isDarkMode}
            />
          ),
        } as any)}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          title: "Map",
          tabBarLabel: "Map",
          tabBarIcon: ({ color, size, focused }: any) => (
            <Ionicons
              name={focused ? "location" : "location-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      
      <Tab.Screen
        {...({
          name: "Profile",
          options: {
            title: "Profile",
            tabBarLabel: "Profile",
            tabBarIcon: ({ color, size, focused }: any) => (
              <Ionicons
                name={focused ? "person-circle" : "person-circle-outline"}
                size={size}
                color={color}
              />
            ),
          },
          children: () => (
            <ProfileScreen
              onLogout={onLogout}
              onOpenSettings={openSettingsPage}
              currentUser={currentUser}
              onProfileUpdate={onProfileUpdate}
            />
          ),
        } as any)}
      />
    </Tab.Navigator>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

const NAVIGATION_STATE_KEY = "@bsads/navigation_state";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<BeekeeperProfile | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const initialWebPath = useMemo(() => getInitialWebPath(), []);
  
  // Notifications
  const { expoPushToken } = useNotifications();

  // Load fonts and icons
  let [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const [iconsLoaded, setIconsLoaded] = useState(false);
  
  // Fallback for fonts loading timeout
  const [fontsTimedOut, setFontsTimedOut] = useState(false);

  // Preload Ionicons
  useEffect(() => {
    async function loadIcons() {
      try {
        await Ionicons.loadFont();
        setIconsLoaded(true);
      } catch (error) {
        console.warn("Failed to load Ionicons:", error);
        setIconsLoaded(true); // Proceed even if icons fail to load
      }
    }
    loadIcons();
  }, []);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log("[App] Font loading timed out - proceeding without custom fonts");
      setFontsTimedOut(true);
    }, 3000); // 3 seconds timeout
    
    return () => clearTimeout(timeout);
  }, []);

  // Load Google Fonts for web
  useEffect(() => {
    if (Platform.OS === "web") {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap";
      document.head.appendChild(link);
      return () => {
        document.head.removeChild(link);
      };
    }
  }, []);

  const colors = darkModeEnabled ? APP_COLORS.dark : APP_COLORS.light;

  const navigationTheme = useMemo(
    () =>
      darkModeEnabled
        ? {
            ...DarkTheme,
            colors: {
              ...DarkTheme.colors,
              primary: colors.primary,
              background: colors.page,
              card: colors.surface,
              text: colors.text,
              border: colors.border,
            },
          }
        : {
            ...DefaultTheme,
            colors: {
              ...DefaultTheme.colors,
              primary: colors.primary,
              background: colors.page,
              card: colors.surface,
              text: colors.text,
              border: colors.border,
            },
          },
    [darkModeEnabled, colors],
  );

  useEffect(() => {
    let cancelled = false;

    // Never block the UI longer than 5s waiting on AsyncStorage.
    const forceDone = setTimeout(() => {
      if (!cancelled) setBootstrapping(false);
    }, 5000);

    void (async () => {
      try {
        const [user, darkMode] = await Promise.all([
          initAuthFromStorage(),
          AsyncStorage.getItem(PREF_DARK_MODE),
        ]);
        if (cancelled) return;
        if (user) {
          setCurrentUser(user);
          setIsAuthenticated(true);
        }
        if (darkMode !== null) {
          const enabled = darkMode === "true";
          setDarkModeEnabled(enabled);
          applyThemeMode(enabled);
        }
      } catch {
        // no stored session — stay on auth flow
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(forceDone);
    };
  }, []);

  const handleAuthSuccess = (user: BeekeeperProfile) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Register the 401 handler so expired tokens auto-redirect to login
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setCurrentUser(null);
      setIsAuthenticated(false);
    });
  }, []);

  // Process offline queue when network comes back online and on app start
  useEffect(() => {
    // Process queue on app start
    void processQueue();

    // Listen for network changes
    const subscription = Network.addNetworkStateListener(async (state) => {
      if (state.isConnected) {
        console.log("[App] Network connected — processing offline queue");
        await processQueue();
      }
    });

    return () => subscription.remove();
  }, []);

  // ── 30-minute idle session timeout ────────────────────────────────────────
  const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetIdleTimer = useCallback(() => {
    if (!isAuthenticated) return;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      void handleLogout();
    }, SESSION_TIMEOUT_MS);
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start / clear the timer whenever auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      resetIdleTimer();
    } else {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    }
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isAuthenticated, resetIdleTimer]);

  // Reset on app foreground (catches device coming back from sleep)
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && isAuthenticated) {
        resetIdleTimer();
      }
    });
    return () => sub.remove();
  }, [isAuthenticated, resetIdleTimer]);

  const handleDarkModeChange = async (value: boolean) => {
    applyThemeMode(value);
    setDarkModeEnabled(value);
    try {
      await AsyncStorage.setItem(PREF_DARK_MODE, String(value));
    } catch {
      // ignore storage write failures
    }
  };

  if ((!fontsLoaded && !fontError && !fontsTimedOut) || bootstrapping || !iconsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.surface,
        }}
      >
        <ActivityIndicator size="large" color={THEME.accent} />
      </View>
    );
  }

  return (
    <>
      <OfflineBanner />
      <NavigationContainer 
        {...({
          theme: navigationTheme,
          linking: linking,
          onStateChange: () => {
            // Reset idle timer on any navigation (counts as user activity)
            resetIdleTimer();
          },
        } as any)}
      >
        <ExpoStatusBar style={colors.statusBar} />
        <NotificationHandler />
        <RootStack.Navigator
          {...({
            initialRouteName: isAuthenticated
              ? initialWebPath === "/settings"
                ? "Settings"
                : "MainTabs"
              : getInitialAuthRoute(initialWebPath),
            screenOptions: {
              headerShown: false,
              contentStyle: { backgroundColor: colors.page },
              animation: "slide_from_right",
            },
          } as any)}
        >
          {!isAuthenticated ? (
            <>
              <RootStack.Screen name="Welcome" component={WelcomeScreen} />
              <RootStack.Screen
                {...({
                  name: "Login",
                  children: (props: any) => (
                    <LoginScreen {...props} onAuthSuccess={handleAuthSuccess} />
                  ),
                } as any)}
              />
              <RootStack.Screen
                {...({
                  name: "Signup",
                  children: (props: any) => (
                    <SignupScreen {...props} onAuthSuccess={handleAuthSuccess} />
                  ),
                } as any)}
              />
            </>
          ) : (
            <>
              <RootStack.Screen
                {...({
                  name: "MainTabs",
                  children: (props: any) => (
                    <MainTabsScreen
                      {...props}
                      currentUser={currentUser}
                      onProfileUpdate={setCurrentUser}
                      onLogout={() => void handleLogout()}
                      isDarkMode={darkModeEnabled}
                      initialTabRoute={getInitialTabRoute(initialWebPath)}
                    />
                  ),
                } as any)}
              />
              <RootStack.Screen
                {...({
                  name: "Settings",
                  options: {
                    headerShown: true,
                    title: "Settings",
                    headerStyle: { backgroundColor: colors.surface },
                    headerTintColor: colors.text,
                    headerTitleStyle: { fontWeight: "800" },
                  },
                  children: (props: any) => (
                    <SettingsScreen
                      {...props}
                      darkModeEnabled={darkModeEnabled}
                      onDarkModeChange={handleDarkModeChange}
                    />
                  ),
                } as any)}
              />
            </>
          )}
        </RootStack.Navigator>
      </NavigationContainer>
      <Toast />
    </>
  );
}
