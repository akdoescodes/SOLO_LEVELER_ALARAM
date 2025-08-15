import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Folder } from 'lucide-react-native';
import { theme } from '@/constants/theme';

interface AddFolderModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, description: string, color: string) => void;
}

const folderColors = [
  '#667eea', '#764ba2', '#f093fb', '#f5576c',
  '#4facfe', '#00f2fe', '#a8edea', '#fed6e3',
  '#ffecd2', '#fcb69f', '#ffeaa7', '#fd79a8'
];

export function AddFolderModal({ visible, onClose, onSave }: AddFolderModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(folderColors[0]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a folder name');
      return;
    }

    onSave(name.trim(), description.trim(), selectedColor);
    
    // Reset form
    setName('');
    setDescription('');
    setSelectedColor(folderColors[0]);
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setSelectedColor(folderColors[0]);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={[theme.colors.headerBackground, theme.colors.background]}
          style={StyleSheet.absoluteFillObject}
        />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>New Folder</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.previewContainer}>
            <LinearGradient
              colors={[selectedColor, `${selectedColor}80`]}
              style={styles.preview}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Folder size={32} color="white" />
              <Text style={styles.previewName}>{name || 'Folder Name'}</Text>
            </LinearGradient>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Folder Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter folder name"
              placeholderTextColor={theme.colors.text.secondary}
              maxLength={30}
            />

            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter folder description"
              placeholderTextColor={theme.colors.text.secondary}
              multiline
              numberOfLines={3}
              maxLength={100}
            />

            <Text style={styles.label}>Folder Color</Text>
            <View style={styles.colorGrid}>
              {folderColors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.selectedColor,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
  },
  saveButton: {
    padding: theme.spacing.sm,
  },
  saveButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: '#667eea', // Use a direct color since theme.colors.primary doesn't exist
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  preview: {
    width: 120,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  previewName: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: 'white',
    marginTop: theme.spacing.xs,
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.sm,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: theme.spacing.xs,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: theme.colors.text.primary,
  },
});
