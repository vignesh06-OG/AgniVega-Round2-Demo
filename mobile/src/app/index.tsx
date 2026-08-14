import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { Stack } from "expo-router";

export default function FarmerScreen() {
  const [crop, setCrop] = useState("");
  const [quantity, setQuantity] = useState("");

  return (
    <ScrollView className="flex-1 bg-white">
      <Stack.Screen options={{ title: "Farmer Portal" }} />
      <View className="p-6">
        <Text className="text-3xl font-bold text-green-900 mb-2">Smart Krishi-Yatra</Text>
        <Text className="text-gray-600 mb-8">Enter your load details to find the best market.</Text>

        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Crop Type</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-4 bg-gray-50 text-base"
            placeholder="e.g. Onion"
            value={crop}
            onChangeText={setCrop}
          />
        </View>

        <View className="mb-8">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Quantity (Quintals)</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-4 bg-gray-50 text-base"
            placeholder="10"
            keyboardType="numeric"
            value={quantity}
            onChangeText={setQuantity}
          />
        </View>

        <TouchableOpacity className="bg-green-600 rounded-lg py-4 items-center">
          <Text className="text-white font-bold text-lg">Calculate & Pool</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
