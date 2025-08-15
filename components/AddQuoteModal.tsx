import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Quote as QuoteIcon, Trash2 } from 'lucide-react-native';
import { Quote } from '@/types';
import { theme, commonStyles } from '@/constants/theme';

interface AddQuoteModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (quote: Quote) => void;
  onDelete?: (quoteId: string) => void;
  editingQuote?: Quote | null;
  folderId?: string;
}

export function AddQuoteModal({ visible, onClose, onSave, onDelete, editingQuote, folderId }: AddQuoteModalProps) {
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(0);

  const gradientOptions = [
    ['#8B5CF6', '#EC4899', '#EF4444'], // Purple to Pink to Red
    ['#3B82F6', '#8B5CF6', '#EC4899'], // Blue to Purple to Pink
    ['#10B981', '#3B82F6', '#8B5CF6'], // Green to Blue to Purple
    ['#F59E0B', '#EF4444', '#EC4899'], // Yellow to Red to Pink
    ['#6366F1', '#8B5CF6', '#EC4899'], // Indigo to Purple to Pink
    ['#EF4444', '#F59E0B', '#10B981'], // Red to Yellow to Green
  ];

  // Load quote data when editing
  useEffect(() => {
    if (editingQuote) {
      setText(editingQuote.text);
      setAuthor(editingQuote.author || '');
      // Find the gradient index or default to 0
      const gradientIndex = gradientOptions.findIndex(
        gradient => JSON.stringify(gradient) === JSON.stringify(editingQuote.gradientColors)
      );
      setSelectedGradient(gradientIndex >= 0 ? gradientIndex : 0);
    } else {
      resetForm();
    }
  }, [editingQuote, visible]);

  const resetForm = () => {
    setText('');
    setAuthor('');
    setSelectedGradient(0);
  };

  const handleSave = () => {
    if (!text.trim()) {
      Alert.alert('Error', 'Please enter a quote');
      return;
    }

    if (editingQuote) {
      // Update existing quote
      const updatedQuote: Quote = {
        ...editingQuote,
        text: text.trim(),
        author: author.trim() || undefined,
        gradientColors: gradientOptions[selectedGradient],
      };
      onSave(updatedQuote);
    } else {
      // Create new quote
      const newQuote: Quote = {
        id: Date.now().toString(),
        text: text.trim(),
        author: author.trim() || undefined,
        gradientColors: gradientOptions[selectedGradient],
        createdAt: Date.now(),
        folderId: folderId || '',
      };
      onSave(newQuote);
    }
    
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>{editingQuote ? 'Edit Quote' : 'New Quote'}</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quote</Text>
              <View style={styles.quoteContainer}>
                <QuoteIcon size={24} color={theme.colors.text.accent} />
                <TextInput
                  style={styles.quoteInput}
                  value={text}
                  onChangeText={setText}
                  placeholder="Enter your favorite quote"
                  placeholderTextColor={theme.colors.text.secondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Author (Optional)</Text>
              <TextInput
                style={styles.input}
                value={author}
                onChangeText={setAuthor}
                placeholder="Enter author name"
                placeholderTextColor={theme.colors.text.secondary}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose Color Theme</Text>
              <View style={styles.gradientOptions}>
                {gradientOptions.map((colors, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.gradientOption,
                      selectedGradient === index && styles.selectedGradientOption
                    ]}
                    onPress={() => setSelectedGradient(index)}
                  >
                    <LinearGradient
                      colors={colors as any}
                      style={styles.gradientPreview}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {editingQuote && (
              <View style={styles.section}>
                <TouchableOpacity 
                  style={[styles.dangerButton, commonStyles.glassCard]}
                  onPress={() => {
                    Alert.alert(
                      'Delete Quote',
                      'Are you sure you want to delete this quote?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => {
                            onDelete?.(editingQuote.id);
                            resetForm();
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Trash2 size={20} color="#ef4444" />
                  <Text style={styles.dangerButtonText}>Delete Quote</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
  },
  saveButton: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.accent,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  input: {
    ...commonStyles.glassCard,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.primary,
  },
  quoteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...commonStyles.glassCard,
    padding: theme.spacing.md,
  },
  quoteInput: {
    flex: 1,
    marginLeft: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.primary,
    minHeight: 100,
  },
  gradientOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  gradientOption: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedGradientOption: {
    borderColor: theme.colors.text.primary,
    borderWidth: 3,
  },
  gradientPreview: {
    width: 50,
    height: 50,
    borderRadius: theme.borderRadius.md,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  dangerButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: '#ef4444',
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  deleteButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
  },
});