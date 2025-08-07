export const theme = {
  colors: {
    // App background
    background: '#010101',
    
    // Header background
    headerBackground: '#1a1a1a',
    
    // Status bar background (should match header)
    statusBarBackground: '#1a1a1a', // Changed from red to match header
    
    // Surface backgrounds
    surface: {
      primary: 'rgba(0, 0, 0, 0.5)', // bg-surface/50
      secondary: 'rgba(17, 24, 39, 0.8)', // darker surface
    },
    
    // Text colors
    text: {
      primary: '#FFFFFF',
      secondary: '#9CA3AF', // text-gray-400
      accent: '#60A5FA', // text-primary-400
    },
    
    // Borders
    border: {
      primary: '#374151', // border-gray-800
      secondary: '#4B5563', // border-gray-700
      accent: '#3B82F6', // border-primary-500
    },
    
    // Gradient colors
    gradient: {
      primary: ['#10b981', '#3b82f6'], // green to blue
      angle: 135, // diagonal gradient
    },
    
    // Status colors
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Border radius
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 999,
  },
  
  // Typography
  typography: {
    fontFamily: {
      regular: 'Inter-Regular',
      medium: 'Inter-Medium',
      bold: 'Inter-Bold',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.8,
    },
  },
  
  // Shadows
  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 15,
      elevation: 8,
    },
  },
  
  // Animation
  animation: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: {
      easeInOut: 'ease-in-out',
      easeOut: 'ease-out',
      easeIn: 'ease-in',
    },
  },
} as const;

// Common style patterns
export const commonStyles = {
  // Glass-morphism card
  glassCard: {
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface.primary,
  },
  
  // Primary button
  primaryButton: {
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  
  // Filter button inactive
  filterButtonInactive: {
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  
  // Filter button active
  filterButtonActive: {
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.accent,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
};
