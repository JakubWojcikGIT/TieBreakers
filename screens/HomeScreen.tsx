import React from 'react';
import { SafeAreaView, View, Text, Image, TouchableOpacity, StyleSheet, StatusBar, ScrollView } from 'react-native';

type MenuButtonProps = {
  icon: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
};

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/app.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Nazwa aplikacji */}
        <Text style={styles.title}>TieBreakers</Text>

        {/* Menu główne */}
        <View style={styles.menu}>
          <MenuButton
            icon="🏆"
            title="Nowy Turniej"
            subtitle="Utwórz turniej singiel / debel"
            onPress={() => navigation.navigate('TournamentCreate')}
          />
          <MenuButton
            icon="🎾"
            title="Nowy pojedyńczy mecz"
            subtitle="Szybki mecz singiel/debel"
            onPress={() => navigation.navigate('SingleMatchCreate')}
          />
          <MenuButton
            icon="👥"
            title="Gracze"
            subtitle="Dodaj / usuń graczy, przeglądaj bazę"
            onPress={() => navigation.navigate('Players')}
          />
          <MenuButton
            icon="📊"
            title="Wyniki"
            subtitle="Podgląd meczów, filtrowanie i sortowanie"
            onPress={() => navigation.navigate('GlobalStats')}
          />
          <MenuButton
            icon="📅"
            title="Historia Turniejów"
            subtitle="Zakończone turnieje, archiwalne wyniki"
            onPress={() => navigation.navigate('TournamentsHistory')}
          />
          <MenuButton
            icon="ℹ️"
            title="O Aplikacji"
            subtitle="Dowiedz się więcej o TieBreakers"
            onPress={() => navigation.navigate('About')}
          />
        </View>

        {/* Wersja */}
        <Text style={styles.version}>v1.0 Beta</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// Komponent przycisku menu z obsługą onPress
function MenuButton({ icon, title, subtitle, onPress }: MenuButtonProps) {
  return (
    <TouchableOpacity
      style={styles.menuButton}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.menuIconContainer}>
        <Text style={styles.menuIcon}>{icon}</Text>
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle !== "" && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  logoContainer: {
    backgroundColor: '#eaf8e6',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    marginTop: 16,
  },
  logo: {
    width: 90,
    height: 90,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#222',
    letterSpacing: 1,
  },
  menu: {
    width: '100%',
    marginBottom: 24,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafbfc',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  menuIconContainer: {
    width: 38,
    alignItems: 'center',
    marginRight: 10,
  },
  menuIcon: {
    fontSize: 26,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#222',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  version: {
    color: '#bbb',
    fontSize: 13,
    marginTop: 18,
    textAlign: 'center',
  },
});
