import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Folder, Star } from 'lucide-react-native';
import { QuoteFolder } from '@/types';

interface FolderCardProps {
  folder: QuoteFolder;
  onPress: () => void;
  onLongPress?: () => void;
}

export function FolderCard({ folder, onPress, onLongPress }: FolderCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[folder.color, `${folder.color}80`]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Folder size={24} color="white" />
            {folder.isDefault && (
              <View style={styles.defaultBadge}>
                <Star size={12} color="white" fill="white" />
              </View>
            )}
          </View>
          
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {folder.name}
            </Text>
            {folder.description && (
              <Text style={styles.description} numberOfLines={2}>
                {folder.description}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.stats}>
          <Text style={styles.quoteCount}>
            {folder.quoteCount} quote{folder.quoteCount !== 1 ? 's' : ''}
          </Text>
          {folder.isDefault && (
            <Text style={styles.defaultLabel}>Default</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 0, // Remove horizontal margin to allow full width
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    padding: 16,
    minHeight: 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  defaultBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 2,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteCount: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  defaultLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white', // Changed from gold to white
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // White background with transparency
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
