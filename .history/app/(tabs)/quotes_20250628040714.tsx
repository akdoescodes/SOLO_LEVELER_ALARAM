import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Quote as QuoteIcon } from 'lucide-react-native';
import { useStorage } from '@/hooks/useStorage';
import { QuoteCard } from '@/components/QuoteCard';
import { AddQuoteModal } from '@/components/AddQuoteModal';
import { theme } from '@/constants/theme';

export default function QuotesScreen() {
  const { quotes, saveQuotes, loaded } = useStorage();
  const [showAddModal, setShowAddModal] = useState(false);

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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
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

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {quotes.length === 0 ? (
            <View style={styles.emptyState}>
              <QuoteIcon size={64} color={theme.colors.text.secondary} />
              <Text style={styles.emptyStateTitle}>No Quotes Added</Text>
              <Text style={styles.emptyStateText}>
                Add your favorite quotes to see them when your alarm rings
              </Text>
            </View>
          ) : (
            quotes.map(quote => (
              <QuoteCard
                key={quote.id}
                quote={quote}
                onDelete={() => deleteQuote(quote.id)}
                showDeleteButton={true}
              />
            ))
          )}
        </ScrollView>

        <AddQuoteModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={(newQuote) => {
            saveQuotes([...quotes, newQuote]);
            setShowAddModal(false);
          }}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
    textAlignVertical: 'center',
  },
});