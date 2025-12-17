import { useAuth } from "@/lib/authContext";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";

export default function Index() {
  const { signOut } = useAuth();
  return (
    <View style={styles.view}>
      <Text>WELCOME to Habit Tracker Home</Text>

      <Button mode="text" onPress={signOut} icon={"logout"}>
        Sign Out
      </Button>

      {/*<Link href="/login" style={styles.navButton}>
        Login Page
      </Link>*/}
    </View>
  );
}

const styles = StyleSheet.create({
  view: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  navButton: {
    width: 100,
    height: 20,
    backgroundColor: "orange",
    justifyContent: "center",
    alignItems: "center",
  },
});
