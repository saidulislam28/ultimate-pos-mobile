import { PRIMARY_COLOR } from "@/constants/Colors";
import { AntDesign } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface CommonHeaderProps {
  icon?: React.ComponentProps<typeof AntDesign>["name"];
  onPress?: () => void;
  text?: string;
  backRoute?: string;
  replaceRoute?: string;
}

export default function CommonHeader({
  icon = "left",
  onPress,
  text = "Back",
  backRoute,
  replaceRoute
}: CommonHeaderProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    if (backRoute) {
      router.back();
      router.push(backRoute as any);
      return;
    }

    if (replaceRoute) {
      router.back();
      router.replace(replaceRoute as any);
      return;
    }

    // Default behavior
    router.back();
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.buttonContainer} onPress={handlePress}>
        <AntDesign
          style={{ marginRight: 4 }}
          name={icon}
          size={18}
          color="white"
        />
        <Text style={styles.backButton}>{text}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 16,
    paddingHorizontal: 20
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  backButton: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});