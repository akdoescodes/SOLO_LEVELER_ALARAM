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
  const cardColors = isFullScreen ? gradientColors : [theme.colors.surface.primary, theme.colors.surface.secondary];
  
  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={cardColors as any}
        style={[styles.card, isFullScreen && styles.fullScreenCard, commonStyles.glassCard]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <QuoteIcon size={isFullScreen ? 40 : 28} color={isFullScreen ? theme.colors.text.primary : theme.colors.text.accent} />
          {showDeleteButton && onDelete && (
            <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
              <Trash2 size={20} color={isFullScreen ? theme.colors.text.primary : theme.colors.error} />
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
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  card: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg, // Reduced from xl to lg
    paddingVertical: theme.spacing.md, // Even less vertical padding
    minHeight: 180, // Reduced from 200 to make it more slim
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  fullScreenCard: {
    borderRadius: 0,
    padding: theme.spacing.xxl,
    minHeight: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md, // Reduced from xl to md
  },
  deleteButton: {
    padding: theme.spacing.xs,
  },
  quoteText: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.primary,
    lineHeight: 34,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  fullScreenQuoteText: {
    fontSize: theme.typography.fontSize['2xl'],
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
    lineHeight: 44,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  author: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.secondary,
    textAlign: 'right',
  },
  fullScreenAuthor: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
    textAlign: 'center',
    opacity: 0.9,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});