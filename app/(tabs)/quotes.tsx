import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Quote as QuoteIcon } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useStorage } from '@/hooks/useStorage';
import { QuoteCard } from '@/components/QuoteCard';
import { AddQuoteModal } from '@/components/AddQuoteModal';
import { theme, commonStyles } from '@/constants/theme';

export default function QuotesScreen() {
  const { quotes, saveQuotes, loaded } = useStorage();
  const [showAddModal, setShowAddModal] = useState(false);

  // Scroll enhancement states
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); // Track if user has scrolled

  // Handle scroll events for progress and end detection
  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollPosition = contentOffset.y;
    const contentHeight = contentSize.height;
    const screenHeight = layoutMeasurement.height;
    
    // Track if scrolled for header background
    setIsScrolled(scrollPosition > 0);
    
    // Calculate scroll progress (0 to 1)
    const maxScroll = contentHeight - screenHeight;
    const progress = maxScroll > 0 ? scrollPosition / maxScroll : 0;
    setScrollProgress(Math.min(Math.max(progress, 0), 1));
    
    // Check if near bottom (within 50px)
    const isNearBottom = scrollPosition + screenHeight >= contentHeight - 50;
    setIsAtBottom(isNearBottom);
    
    // Track if user has scrolled (even a little)
    setIsScrolled(scrollPosition > 0);
  };

  // Set status bar for quotes page
  useEffect(() => {
    StatusBar.setBarStyle('light-content', true);
    
    // Only set background color on Android
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(theme.colors.statusBarBackground, true);
    }
  }, []);

  // Update status bar color based on scroll state
  useEffect(() => {
    if (Platform.OS === 'android') {
      const statusBarColor = isScrolled ? theme.colors.statusBarBackground : theme.colors.background;
      StatusBar.setBackgroundColor(statusBarColor, true);
    }
  }, [isScrolled]);

  // Also set status bar when page is focused
  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content', true);
      
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(theme.colors.statusBarBackground, true);
      }
    }, [])
  );

  const deleteQuote = (quoteId: string) => {
    Alert.alert(
      'Delete Quote',
      'Are you sure you want to delete this quote?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedQuotes = quotes.filter(quote => quote.id !== quoteId);
            saveQuotes(updatedQuotes);
          },
        },
      ]
    );
  };

  if (!loaded) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
        <SafeAreaView style={styles.safeArea}>
          <Text style={styles.loadingText}>Loading...</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.headerBackground }]}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={Platform.OS === 'android' ? theme.colors.statusBarBackground : undefined} 
        translucent={true} 
      />
      <View style={[
        styles.headerContainer, 
        { backgroundColor: isScrolled ? theme.colors.headerBackground : theme.colors.background }
      ]}>
        <SafeAreaView style={[
          styles.headerSafeArea,
          { backgroundColor: isScrolled ? theme.colors.headerBackground : theme.colors.background }
        ]}>
          <View style={styles.header}>
            <Text style={styles.title}>Quotes</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <LinearGradient
                colors={theme.colors.gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.addButtonGradient}
              >
                <Plus size={24} color={theme.colors.text.primary} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
    
    <View style={styles.contentContainer}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={true}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={true}
        alwaysBounceVertical={true}
        indicatorStyle="white"
      >
          {quotes.length === 0 ? (
            <View style={styles.emptyState}>
              <QuoteIcon size={64} color={theme.colors.text.secondary} />
              <Text style={styles.emptyStateTitle}>No Quotes Added</Text>
              <Text style={styles.emptyStateText}>
                Add your favorite quotes to see them when your alarm rings
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Quotes</Text>
              {quotes.map(quote => (
                <QuoteCard
                  key={quote.id}
                  quote={quote}
                  onDelete={() => deleteQuote(quote.id)}
                  showDeleteButton={true}
                />
              ))}
              
              {/* End spacing for visual breathing room */}
              <View style={styles.endSpacing} />
            </>
          )}
        </ScrollView>
      </View>

      <AddQuoteModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={(newQuote) => {
          saveQuotes([...quotes, newQuote]);
          setShowAddModal(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: theme.colors.headerBackground,
  },
  headerSafeArea: {
    backgroundColor: theme.colors.headerBackground,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 2, // Made much smaller - same as alarms
    backgroundColor: 'transparent', // Remove background since parent handles it
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'], // Keep 30px like alarms
    fontFamily: theme.typography.fontFamily.medium, // Medium weight like alarms
    color: theme.colors.text.primary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    ...theme.shadows.md,
  },
  addButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: theme.spacing.md, // Reduced from lg to md
  },
  scrollViewContent: {
    paddingBottom: 100, // Account for tab bar height + extra spacing
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl * 2, // 96px for consistency
  },
  emptyStateTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
  },
  emptyStateText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
    textAlign: 'center',
    flex: 1,
    textAlignVertical: 'center',
  },
  endSpacing: {
    height: theme.spacing.xl * 2, // Extra spacing at the end for visual breathing room
    marginTop: theme.spacing.lg,
  },
});