import { useAuth } from "@/lib/authContext";
import { Text, View } from "react-native";
import { Button } from "react-native-paper";

export default function LoginScreen() {
  const { signOut } = useAuth();
  return (
    <View>
      <Text>This is the Login Page</Text>
      <Button mode="text" onPress={signOut} icon={"logout"}>
        Sign Out
      </Button>
    </View>
  );
}
