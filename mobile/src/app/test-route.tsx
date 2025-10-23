import React from 'react';
import { View, Text, Button } from 'react-native';
import { router } from 'expo-router';

export default function TestRoute() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Test Route Works!</Text>
      <Text style={{ fontSize: 16, marginBottom: 20, textAlign: 'center' }}>
        This confirms that routing is working in Expo Go
      </Text>
      <Button 
        title="Go Back" 
        onPress={() => router.back()} 
      />
    </View>
  );
}
