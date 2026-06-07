require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    name: "Service Time",
    slug: "service-time",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "service-time",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.servicetime.app",
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#171717",
      },
      package: "com.servicetime.app",
    },
    web: {
      bundler: "metro",
    },
    plugins: ["expo-router"],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};
