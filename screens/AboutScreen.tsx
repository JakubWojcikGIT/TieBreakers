import React from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  StyleSheet, 
  StatusBar, 
  ScrollView, 
  TouchableOpacity,
  Linking
} from 'react-native';

export default function AboutScreen({ navigation }: any) {
  const handleLinkPress = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>🎾</Text>
          <Text style={styles.title}>TieBreakers</Text>
          <Text style={styles.version}>Wersja 1.0 Beta</Text>
        </View>

        {/* Opis aplikacji */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 O Aplikacji</Text>
          <Text style={styles.description}>
            TieBreakers to mobilna aplikacja stworzona z pasji do tenisa! 
            Pozwala łatwo organizować turnieje, zarządzać graczami i śledzić wyniki. 
            Wszystko w jednym miejscu, bez zbędnych komplikacji.
          </Text>
        </View>

        {/* Funkcje */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Główne Funkcje</Text>
          <View style={styles.featuresList}>
            <Text style={styles.feature}>🎯 Tworzenie turniejów (każdy z każdym)</Text>
            <Text style={styles.feature}>👥 Zarządzanie bazą graczy</Text>
            <Text style={styles.feature}>📊 Automatyczne liczenie wyników</Text>
            <Text style={styles.feature}>📱 Synchronizacja w chmurze</Text>
            <Text style={styles.feature}>🏅 Historia wszystkich turniejów</Text>
          </View>
        </View>

        {/* Technologie */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 Technologie</Text>
          <View style={styles.techGrid}>
            <View style={styles.techItem}>
              <Text style={styles.techEmoji}>⚛️</Text>
              <Text style={styles.techName}>React Native</Text>
            </View>
            <View style={styles.techItem}>
              <Text style={styles.techEmoji}>📱</Text>
              <Text style={styles.techName}>Expo</Text>
            </View>
            <View style={styles.techItem}>
              <Text style={styles.techEmoji}>🔥</Text>
              <Text style={styles.techName}>Firebase</Text>
            </View>
            <View style={styles.techItem}>
              <Text style={styles.techEmoji}>💙</Text>
              <Text style={styles.techName}>TypeScript</Text>
            </View>
          </View>
        </View>

        {/* Plany rozwoju */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚀 Co dalej?</Text>
          <Text style={styles.description}>
            • Ranking globalny graczy{'\n'}
            • Powiadomienia o turniejach{'\n'}
            • Eksport wyników do PDF{'\n'}
            • Tryb debla{'\n'}
            • Publikacja w App Store/Google Play
          </Text>
        </View>

        {/* Autor */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👨‍💻 Autor</Text>
          <Text style={styles.description}>
            Stworzone z ❤️ przez pasjonata tenisa i programowania.
            {'\n\n'}
            Masz pomysł na nową funkcję? Znalazłeś błąd? 
            Napisz - chętnie posłucham opinii!
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Dziękuję za korzystanie z TieBreakers! 🎾
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Powrót do menu</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 20,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 20,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 5,
  },
  version: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 25,
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
  },
  featuresList: {
    gap: 8,
  },
  feature: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
  },
  techGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  techItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: '45%',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  techEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  techName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 18,
    color: '#007a32',
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#007a32',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
