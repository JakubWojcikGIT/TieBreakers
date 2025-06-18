import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import HomeScreen from './screens/HomeScreen';
import PlayersScreen from './screens/PlayersScreen';
import TournamentCreateScreen from './screens/TournamentCreateScreen';
import TournamentViewScreen from './screens/TournamentViewScreen';
import TournamentsHistoryScreen from './screens/TournamentsHistoryScreen';
import TournamentDetailsScreen from './screens/TournamentDetailsScreen';
import AboutScreen from './screens/AboutScreen';
import TeamPairingScreen from './screens/TeamPairingScreen';
import GlobalStatsScreen from './screens/GlobalStatsScreen';
import SingleMatchCreateScreen from './screens/SingleMatchCreateScreen';
import SingleMatchScreen from './screens/SingleMatchScreen';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Europe/Warsaw');

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator id={undefined} initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'TieBreakers' }} />
        <Stack.Screen name="Players" component={PlayersScreen} options={{ title: 'Gracze' }} />
        <Stack.Screen name="TournamentCreate" component={TournamentCreateScreen} options={{ title: 'Nowy Turniej' }} />
        <Stack.Screen name="TeamPairing" component={TeamPairingScreen} options={{ title: 'Parowanie drużyn' }} />
        <Stack.Screen name="TournamentView" component={TournamentViewScreen} options={{ title: 'Widok Turnieju' }} />
        <Stack.Screen name="TournamentsHistory" component={TournamentsHistoryScreen} options={{ title: 'Historia turniejów' }} />
        <Stack.Screen name="TournamentDetails" component={TournamentDetailsScreen} options={{ title: 'Szczegóły turnieju' }} />
        <Stack.Screen name="About" component={AboutScreen} options={{ title: 'O Aplikacji' }} />
        <Stack.Screen name="GlobalStats" component={GlobalStatsScreen} options={{ title: 'Statystyki globalne' }} />
        <Stack.Screen name="SingleMatchCreate" component={SingleMatchCreateScreen} options={{ title: 'Nowy pojedyńczy mecz' }} />
        <Stack.Screen name="SingleMatch" component={SingleMatchScreen} options={{ title: 'Pojedyńczy mecz' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
