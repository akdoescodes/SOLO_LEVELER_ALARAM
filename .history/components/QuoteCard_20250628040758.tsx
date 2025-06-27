import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trash2, Quote as QuoteIcon } from 'lucide-react-native';
import { Quote } from '@/types';
import { theme, commonStyles } from '@/constants/theme';

interface QuoteCardProps {
  quote: Quote;
  onDelete?: () => void;
  showDeleteButton?: boolean;
  style?: ViewStyle;
}

export function QuoteCard({ quote, onDelete, showDeleteButton = false, style }: QuoteCardProps) {
  const isFullScreen = style && 'width' in style && style.width === '100%';
  
  const gradientColors = quote.gradientColors || theme.colors.gradient.primary;
  
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.card, commonStyles.glassCard, isFullScreen && styles.fullScreenCard]}>
        {/* Gradient overlay for visual appeal */}
        <LinearGradient
          colors={gradientColors as any}
          style={styles.gradientOverlay}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        <View style={styles.content}>
          <View style={styles.header}>
            <QuoteIcon 
              size={isFullScreen ? 40 : 28} 
              color={isFullScreen ? theme.colors.text.primary : theme.colors.text.accent} 
            />
            {showDeleteButton && onDelete && (
              <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
                <Trash2 
                  size={20} 
                  color={isFullScreen ? theme.colors.text.primary : theme.colors.error} 
                />
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={[
            styles.quoteText, 
            isFullScreen && styles.fullScreenQuoteText
          ]}>
            &ldquo;{quote.text}&rdquo;
          </Text>
          
          {quote.author && (
            <Text style={[
              styles.author, 
              isFullScreen && styles.fullScreenAuthor
            ]}>
              — {quote.author}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
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
  fullScreenCard: {
    borderRadius: 0,
    padding: 40,
    minHeight: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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
  fullScreenQuoteText: {
    fontSize: 32,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    lineHeight: 44,
    marginBottom: 30,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  author: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textAlign: 'right',
  },
  fullScreenAuthor: {
    fontSize: 20,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});