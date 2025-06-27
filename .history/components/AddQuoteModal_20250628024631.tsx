import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Quote as QuoteIcon } from 'lucide-react-native';
import { Quote } from '@/types';

interface AddQuoteModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (quote: Quote) => void;
}

export function AddQuoteModal({ visible, onClose, onSave }: AddQuoteModalProps) {
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

    const newQuote: Quote = {
      id: Date.now().toString(),
      text: text.trim(),
      author: author.trim() || undefined,
      gradientColors: gradientOptions[selectedGradient],
      createdAt: Date.now(),
    };

    onSave(newQuote);
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.title}>New Quote</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quote</Text>
              <View style={styles.quoteContainer}>
                <QuoteIcon size={24} color="#8B5CF6" />
                <TextInput
                  style={styles.quoteInput}
                  value={text}
                  onChangeText={setText}
                  placeholder="Enter your favorite quote"
                  placeholderTextColor="#9CA3AF"
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
                placeholderTextColor="#9CA3AF"
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
                      colors={colors}
                      style={styles.gradientPreview}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  saveButton: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
  },
  quoteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
  },
  quoteInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    minHeight: 100,
  },
});