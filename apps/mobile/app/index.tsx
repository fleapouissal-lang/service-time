import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  testSupabaseConnection,
  type SupabaseConnectionResult,
} from "@service-time/lib";

export default function HomeScreen() {
  const [result, setResult] = useState<SupabaseConnectionResult | null>(null);
  const [loading, setLoading] = useState(true);

  async function checkConnection() {
    setLoading(true);
    const connection = await testSupabaseConnection();
    setResult(connection);
    setLoading(false);
  }

  useEffect(() => {
    void checkConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Service Time</Text>
      <Text style={styles.title}>Car maintenance, simplified</Text>
      <Text style={styles.subtitle}>
        Expo mobile app connected to shared Supabase client.
      </Text>

      <View
        style={[
          styles.statusCard,
          result?.connected ? styles.statusConnected : styles.statusWarning,
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#171717" />
        ) : (
          <>
            <Text style={styles.statusTitle}>
              Supabase: {result?.connected ? "Connected" : "Not configured"}
            </Text>
            <Text style={styles.statusMessage}>{result?.message}</Text>
          </>
        )}
      </View>

      <Pressable style={styles.button} onPress={() => void checkConnection()}>
        <Text style={styles.buttonText}>Test connection</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    padding: 24,
    justifyContent: "center",
    gap: 12,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#71717a",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#171717",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: "#52525b",
    marginBottom: 8,
  },
  statusCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    minHeight: 88,
    justifyContent: "center",
  },
  statusConnected: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  statusWarning: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#171717",
  },
  statusMessage: {
    marginTop: 4,
    fontSize: 13,
    color: "#52525b",
  },
  button: {
    marginTop: 8,
    backgroundColor: "#171717",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
});
