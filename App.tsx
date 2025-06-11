import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import PlayersScreen from './screens/PlayersScreen';
import TournamentCreateScreen from './screens/TournamentCreateScreen';
import TournamentViewScreen from './screens/TournamentViewScreen';
import TournamentsHistoryScreen from './screens/TournamentsHistoryScreen';
import TournamentDetailsScreen from './screens/TournamentDetailsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator id={undefined} initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'TieBreakers' }} />
        <Stack.Screen name="Players" component={PlayersScreen} options={{ title: 'Gracze' }} />
        <Stack.Screen name="TournamentCreate" component={TournamentCreateScreen} options={{ title: 'Nowy Turniej' }} />
        <Stack.Screen name="TournamentView" component={TournamentViewScreen} options={{ title: 'Widok Turnieju' }} />
        <Stack.Screen name="TournamentsHistory" component={TournamentsHistoryScreen} options={{ title: 'Historia turniejów' }} />
        <Stack.Screen name="TournamentDetails" component={TournamentDetailsScreen} options={{ title: 'Szczegóły turnieju' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
