import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { theme } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ContextMenuProps {
  visible: boolean;
  onClose: () => void;
  buttonPosition: { x: number; y: number };
  onDelete: () => void;
}

export function ContextMenu({ visible, onClose, buttonPosition, onDelete }: ContextMenuProps) {
  const handleDelete = () => {
    onDelete();
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Background overlay */}
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        {/* Context menu */}
        <View 
          style={[
            styles.menuContainer,
            {
              position: 'absolute',
              top: buttonPosition.y + 10, // Just below the button
              right: 16, // Touch the screen edge
              width: SCREEN_WIDTH - buttonPosition.x - 16, // Extend from button to screen edge
              minWidth: 120,
            }
          ]}
          onStartShouldSetResponder={() => true} // Prevent closing when tapping menu
        >
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleDelete}
          >
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
          
          {/* Future menu items can be added here */}
          {/* 
          <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
            <Text style={styles.menuText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleDuplicate}>
            <Text style={styles.menuText}>Duplicate</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleShare}>
            <Text style={styles.menuText}>Share</Text>
          </TouchableOpacity>
          */}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // Very subtle background
  },
  menuContainer: {
    backgroundColor: theme.colors.surface.primary,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    overflow: 'hidden',
  },
  menuItem: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 44, // Minimum touch target
  },
  deleteText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.error,
    textAlign: 'left',
  },
  menuText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.primary,
    textAlign: 'left',
  },
});
