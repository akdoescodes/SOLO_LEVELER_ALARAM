import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trash2, Quote as QuoteIcon } from 'lucide-react-native';
import { Quote } from '@/types';

interface QuoteCardProps {
  quote: Quote;
  onDelete?: () => void;
  showDeleteButton?: boolean;
  style?: ViewStyle;
}

export function QuoteCard({ quote, onDelete, showDeleteButton = false, style }: QuoteCardProps) {
  const isFullScreen = style && 'width' in style && style.width === '100%';
  
  const gradientColors = quote.gradientColors || ['#8B5CF6', '#EC4899', '#EF4444'];
  const cardColors = isFullScreen ? gradientColors : ['#FFFFFF', '#F8FAFC'];
  
  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={cardColors as any}
        style={[styles.card, isFullScreen && styles.fullScreenCard]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <QuoteIcon size={isFullScreen ? 40 : 28} color={isFullScreen ? "#FFFFFF" : "#8B5CF6"} />
          {showDeleteButton && onDelete && (
            <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
              <Trash2 size={20} color={isFullScreen ? "#FFFFFF" : "#EF4444"} />
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={[
          styles.quoteText, 
          isFullScreen && styles.fullScreenQuoteText
        ]}>
          "{quote.text}"
        </Text>
        
        {quote.author && (
          <Text style={[
            styles.author, 
            isFullScreen && styles.fullScreenAuthor
          ]}>
            — {quote.author}
          </Text>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    minHeight: 200,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  deleteButton: {
    padding: 4,
  },
  quoteText: {
    fontSize: 22,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    lineHeight: 34,
    marginBottom: 20,
    textAlign: 'center',
  },
  author: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textAlign: 'right',
  },
});