import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Folder as FolderIcon } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useStorage } from '@/hooks/useStorage';
import { Quote } from '@/types';
import { FolderCard } from '@/components/FolderCard';
import { QuoteCard } from '@/components/QuoteCard';
import { AddQuoteModal } from '@/components/AddQuoteModal';
import { AddFolderModal } from '@/components/AddFolderModal';
import { FolderManagementModal } from '@/components/FolderManagementModal';
import { theme, commonStyles } from '@/constants/theme';

export default function QuotesScreen() {
  const { quoteFolders, quotes, saveQuotes, loaded, createFolder, getQuotesByFolderId, saveQuoteFolders } = useStorage();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showFolderContent, setShowFolderContent] = useState(false);
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<any>(null);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  // ScrollView ref for resetting scroll position
  const scrollViewRef = useRef<ScrollView>(null);

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

  // Also set status bar when page is focused and reset scroll position
  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content', true);
      
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(theme.colors.statusBarBackground, true);
      }
      
      // Reset scroll position to top when page is focused
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }
      
      // Reset scroll states
      setScrollProgress(0);
      setIsAtBottom(false);
      setIsScrolled(false);
    }, [])
  );

  // Helper functions
  const getSelectedFolderName = () => {
    const folder = quoteFolders.find(f => f.id === selectedFolderId);
    return folder?.name || 'Folder';
  };

  const openFolder = (folderId: string) => {
    setSelectedFolderId(folderId);
    setShowFolderContent(true);
  };

  const openFolderManagement = (folder: any) => {
    setSelectedFolder(folder);
    setShowManagementModal(true);
  };

  const goBackToFolders = () => {
    setShowFolderContent(false);
    setSelectedFolderId(null);
  };

  const getCurrentFolderQuotes = () => {
    if (!selectedFolderId) return [];
    return getQuotesByFolderId(selectedFolderId);
  };

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
            <Text style={styles.title}>
              {showFolderContent ? getSelectedFolderName() : 'Quotes'}
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                if (showFolderContent) {
                  setShowAddModal(true);
                } else {
                  setShowAddFolderModal(true);
                }
              }}
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
        ref={scrollViewRef}
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={true}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={true}
        alwaysBounceVertical={true}
        indicatorStyle="white"
      >
        {!showFolderContent ? (
          // Show folders view
          <>
            {quoteFolders.length === 0 ? (
              <View style={styles.emptyState}>
                <FolderIcon size={64} color={theme.colors.text.secondary} />
                <Text style={styles.emptyStateTitle}>No Quote Folders</Text>
                <Text style={styles.emptyStateText}>
                  Create your first folder to organize your quotes
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Folders</Text>
                {quoteFolders.map(folder => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    onPress={() => openFolderManagement(folder)}
                  />
                ))}
                {/* End spacing for visual breathing room */}
                <View style={styles.endSpacing} />
              </>
            )}
          </>
        ) : (
          // Show folder content (quotes inside selected folder)
          <>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={goBackToFolders}
            >
              <Text style={styles.backButtonText}>← Back to Folders</Text>
            </TouchableOpacity>
            
            {getCurrentFolderQuotes().length === 0 ? (
              <View style={styles.emptyState}>
                <FolderIcon size={64} color={theme.colors.text.secondary} />
                <Text style={styles.emptyStateTitle}>No Quotes in This Folder</Text>
                <Text style={styles.emptyStateText}>
                  Add some quotes to this folder to get started
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionTitle}>
                  {getCurrentFolderQuotes().length} Quote{getCurrentFolderQuotes().length !== 1 ? 's' : ''}
                </Text>
                {getCurrentFolderQuotes().map(quote => (
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
          </>
        )}
      </ScrollView>
      </View>

      <AddQuoteModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingQuote(null);
          
          // If we came from a folder modal (either editing or adding), reopen it
          if (selectedFolder) {
            setShowManagementModal(true);
          }
        }}
        editingQuote={editingQuote}
        folderId={selectedFolderId || quoteFolders.find(f => f.isDefault)?.id || quoteFolders[0]?.id}
        onSave={(quote) => {
          if (editingQuote) {
            // Update existing quote
            const updatedQuotes = quotes.map(q => q.id === quote.id ? quote : q);
            saveQuotes(updatedQuotes);
          } else {
            // Add new quote
            const targetFolderId = selectedFolderId || quoteFolders.find(f => f.isDefault)?.id || quoteFolders[0]?.id;
            const quoteWithFolder = { ...quote, folderId: targetFolderId };
            saveQuotes([...quotes, quoteWithFolder]);
          }
          setShowAddModal(false);
          setEditingQuote(null);
          
          // If we came from a folder modal (either editing or adding), reopen it
          if (selectedFolder) {
            setShowManagementModal(true);
          }
        }}
        onDelete={(quoteId) => {
          const updatedQuotes = quotes.filter(q => q.id !== quoteId);
          saveQuotes(updatedQuotes);
          setShowAddModal(false);
          setEditingQuote(null);
          
          // If we were editing from a folder modal, reopen it
          if (selectedFolder) {
            setShowManagementModal(true);
          }
        }}
      />
      
      <AddFolderModal
        visible={showAddFolderModal}
        onClose={() => setShowAddFolderModal(false)}
        onSave={async (name, description, color) => {
          await createFolder(name, description, color);
          setShowAddFolderModal(false);
        }}
      />

      <FolderManagementModal
        visible={showManagementModal}
        folder={selectedFolder}
        quotes={quotes}
        onClose={() => {
          setShowManagementModal(false);
          setSelectedFolder(null);
        }}
        onSave={async (updatedFolder) => {
          const updatedFolders = quoteFolders.map(f => 
            f.id === updatedFolder.id ? updatedFolder : f
          );
          await saveQuoteFolders(updatedFolders);
          setSelectedFolder(updatedFolder);
        }}
        onDelete={async () => {
          if (selectedFolder) {
            // Delete all quotes in the folder first
            const quotesToKeep = quotes.filter(q => q.folderId !== selectedFolder.id);
            await saveQuotes(quotesToKeep);
            
            // Then delete the folder
            const updatedFolders = quoteFolders.filter(f => f.id !== selectedFolder.id);
            await saveQuoteFolders(updatedFolders);
            
            setShowManagementModal(false);
            setSelectedFolder(null);
          }
        }}
        onAddQuote={() => {
          setShowManagementModal(false);
          setSelectedFolderId(selectedFolder?.id);
          setEditingQuote(null);
          setShowAddModal(true);
        }}
        onEditQuote={(quote) => {
          setShowManagementModal(false);
          setSelectedFolderId(selectedFolder?.id || '');
          setEditingQuote(quote);
          setShowAddModal(true);
        }}
        onDeleteQuote={async (quoteId) => {
          const updatedQuotes = quotes.filter(q => q.id !== quoteId);
          await saveQuotes(updatedQuotes);
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
  backButton: {
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
  },
});