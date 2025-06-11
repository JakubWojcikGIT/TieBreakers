import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Sprawdźmy, co zwraca createNativeStackNavigator
const Stack = createNativeStackNavigator();

// Wyeksportujmy to do dalszej analizy
export const StackInfo = {
  Navigator: Stack.Navigator,
  Screen: Stack.Screen
};

// Możemy też dodać funkcję do debugowania
export function debugNavigator() {
  console.log('Stack Navigator props:', Object.keys(Stack.Navigator.propTypes || {}));
  console.log('Stack Navigator type:', typeof Stack.Navigator);
  return Stack;
}
