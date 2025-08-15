import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  X, 
  Edit3, 
  Trash2, 
  Plus, 
  Eye, 
  Folder,
  Star,
  Save,
  Palette,
  Quote as QuoteIcon,
  MoreVertical
} from 'lucide-react-native';
import { QuoteFolder, Quote } from '@/types';
import { theme, commonStyles } from '@/constants/theme';

interface FolderManagementModalProps {
  visible: boolean;
  folder: QuoteFolder | null;
  quotes: Quote[];
  onClose: () => void;
  onSave: (updatedFolder: QuoteFolder) => void;
  onDelete: () => void;
  onAddQuote: () => void;
  onEditQuote: (quote: Quote) => void;
  onDeleteQuote: (quoteId: string) => void;
}

const folderColors = [
  '#4facfe', '#667eea', '#764ba2', '#f093fb', '#f5576c',
  '#00f2fe', '#a8edea', '#fed6e3', '#ffecd2', '#fcb69f',
  '#ffeaa7', '#fd79a8', '#6c5ce7', '#a29bfe', '#fd79a8'
];

export function FolderManagementModal({ 
  visible, 
  folder, 
  quotes,
  onClose, 
  onSave, 
  onDelete, 
  onAddQuote,
  onEditQuote,
  onDeleteQuote
}: FolderManagementModalProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [editedName, setEditedName] = useState(folder?.name || '');
  const [editedDescription, setEditedDescription] = useState(folder?.description || '');
  const [editedColor, setEditedColor] = useState(folder?.color || '#4facfe');

  const folderQuotes = quotes.filter(quote => quote.folderId === folder?.id);

  useEffect(() => {
    if (folder) {
      setEditedName(folder.name);
      setEditedDescription(folder.description || '');
      setEditedColor(folder.color);
    }
  }, [folder]);

  if (!folder) return null;

  const handleSave = () => {
    if (!editedName.trim()) {
      Alert.alert('Error', 'Please enter a folder name');
      return;
    }

    const updatedFolder: QuoteFolder = {
      ...folder,
      name: editedName.trim(),
      description: editedDescription.trim(),
      color: editedColor,
    };

    onSave(updatedFolder);
    setMode('view');
  };

  const handleDeleteRequest = () => {
    const message = folderQuotes.length > 0 
      ? `This will permanently delete the folder "${folder.name}" and all ${folderQuotes.length} quotes inside it. This action cannot be undone.`
      : `This will permanently delete the folder "${folder.name}". This action cannot be undone.`;
    
    Alert.alert(
      'Delete Folder',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  };

  const handleClose = () => {
    setMode('view');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>
              {mode === 'edit' ? 'Edit Folder' : folder?.name || 'Folder'}
            </Text>
            {mode === 'edit' ? (
              <TouchableOpacity onPress={handleSave}>
                <Text style={styles.saveButton}>Save</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setMode('edit')}>
                <Text style={styles.saveButton}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView 
            style={styles.scrollContainer} 
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={true}
            bounces={true}
            indicatorStyle="white"
          >
            {mode === 'edit' ? (
              /* Edit Mode - Like AddAlarmModal sections */
              <>
                {/* 1. Folder Preview Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Folder Preview</Text>
                  <View style={[styles.folderPreview, commonStyles.glassCard]}>
                    <LinearGradient
                      colors={[editedColor, `${editedColor}80`]}
                      style={styles.folderGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.folderIconContainer}>
                        <Folder size={32} color="white" />
                        {folder.isDefault && (
                          <View style={styles.defaultBadge}>
                            <Star size={12} color="white" fill="white" />
                          </View>
                        )}
                      </View>
                      <Text style={styles.folderPreviewName}>
                        {editedName || 'Folder Name'}
                      </Text>
                      <Text style={styles.folderPreviewCount}>
                        {folderQuotes.length} quote{folderQuotes.length !== 1 ? 's' : ''}
                      </Text>
                    </LinearGradient>
                  </View>
                </View>

                {/* 2. Folder Name Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Folder Name</Text>
                  <TextInput
                    style={[styles.input, commonStyles.glassCard]}
                    value={editedName}
                    onChangeText={setEditedName}
                    placeholder="Enter folder name"
                    placeholderTextColor={theme.colors.text.secondary}
                    maxLength={30}
                  />
                </View>

                {/* 3. Description Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, commonStyles.glassCard]}
                    value={editedDescription}
                    onChangeText={setEditedDescription}
                    placeholder="Enter folder description"
                    placeholderTextColor={theme.colors.text.secondary}
                    multiline
                    numberOfLines={3}
                    maxLength={100}
                  />
                </View>

                {/* 4. Folder Color Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Folder Color</Text>
                  <View style={styles.colorPicker}>
                    {folderColors.map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color },
                          editedColor === color && styles.selectedColor,
                        ]}
                        onPress={() => setEditedColor(color)}
                      >
                        {editedColor === color && (
                          <Palette size={16} color="white" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* 5. Danger Zone Section */}
                {!folder.isDefault && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Danger Zone</Text>
                    <TouchableOpacity 
                      style={[styles.dangerButton, commonStyles.glassCard]}
                      onPress={handleDeleteRequest}
                    >
                      <Trash2 size={20} color="#ef4444" />
                      <Text style={styles.dangerButtonText}>Delete Folder</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              /* View Mode - Show Quotes Directly */
              <>
                {/* 1. Folder Info Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Folder Info</Text>
                  <View style={[styles.folderInfo, commonStyles.glassCard]}>
                    <LinearGradient
                      colors={[folder.color, `${folder.color}80`]}
                      style={styles.folderInfoGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.folderIconContainer}>
                        <Folder size={28} color="white" />
                        {folder.isDefault && (
                          <View style={styles.defaultBadge}>
                            <Star size={10} color="white" fill="white" />
                          </View>
                        )}
                      </View>
                      <View style={styles.folderInfoText}>
                        <Text style={styles.folderInfoName}>{folder.name}</Text>
                        <Text style={styles.folderInfoDescription}>
                          {folder.description || 'No description'}
                        </Text>
                      </View>
                    </LinearGradient>
                  </View>
                </View>

                {/* 2. Quotes Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Quotes ({folderQuotes.length})
                  </Text>
                  
                  {/* Add Quote Button */}
                  <View style={styles.addQuoteButtonContainer}>
                    <TouchableOpacity 
                      style={[styles.addQuoteCard, commonStyles.glassCard]}
                      onPress={onAddQuote}
                    >
                      <LinearGradient
                        colors={theme.colors.gradient.primary}
                        style={styles.addQuoteGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Plus size={20} color="white" />
                        <Text style={styles.addQuoteText}>Add Quote to This Folder</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>

                  {/* Show Quotes */}
                  {folderQuotes.length === 0 ? (
                    <View style={[styles.emptyQuotes, commonStyles.glassCard]}>
                      <Text style={styles.emptyQuotesText}>No quotes yet</Text>
                      <Text style={styles.emptyQuotesSubtext}>
                        Add your first quote to this folder
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.quotesList}>
                      {folderQuotes.map((quote) => (
                        <TouchableOpacity 
                          key={quote.id} 
                          style={styles.quoteContainer}
                          onPress={() => onEditQuote(quote)}
                        >
                          <View style={[styles.quoteCard, commonStyles.glassCard]}>
                            <View style={styles.quoteHeader}>
                              <QuoteIcon size={24} color={theme.colors.text.accent} />
                            </View>
                            
                            <Text style={styles.quoteText}>
                              &ldquo;{quote.text}&rdquo;
                            </Text>
                            
                            {quote.author && (
                              <Text style={styles.quoteAuthor}>— {quote.author}</Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}
            
            {/* End spacing for visual breathing room */}
            <View style={styles.endSpacing} />
          </ScrollView>
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
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
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
  // Folder Preview Styles
  folderPreview: {
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  folderGradient: {
    width: 140,
    height: 100,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  folderIconContainer: {
    position: 'relative',
    marginBottom: theme.spacing.xs,
  },
  defaultBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 2,
  },
  folderPreviewName: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: 'white',
    textAlign: 'center',
  },
  folderPreviewCount: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  // Folder Info Styles  
  folderInfo: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  folderInfoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  folderInfoText: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  folderInfoName: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: 'white',
  },
  folderInfoDescription: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  // Input Styles
  input: {
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.primary,
    borderRadius: theme.borderRadius.lg,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColor: {
    borderWidth: 2,
    borderColor: 'white',
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
  // Quotes Section Styles
  addQuoteButtonContainer: {
    marginBottom: theme.spacing.md,
  },
  addQuoteCard: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  addQuoteGradient: {
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  addQuoteText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: 'white',
  },
  emptyQuotes: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
    padding: theme.spacing.lg,
  },
  emptyQuotesText: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptyQuotesSubtext: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  quotesList: {
    gap: theme.spacing.md,
  },
  quoteContainer: {
    marginBottom: theme.spacing.sm,
    width: '100%',
  },
  quoteCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    minHeight: 140,
    justifyContent: 'center',
    width: '100%',
    ...theme.shadows.md,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  quoteText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.primary,
    lineHeight: 24,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  quoteAuthor: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  endSpacing: {
    height: theme.spacing.xl,
    marginTop: theme.spacing.md,
  },
});
