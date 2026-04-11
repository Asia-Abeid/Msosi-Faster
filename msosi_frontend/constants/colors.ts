// Theme colors — Vibrant Orange & Clean Whites
export const Colors = {
  primary: '#C43C00',       // Vibrant Burnt Orange (User requested)
  secondary: '#FF6D00',     // Lighter vibrant orange for accents/gradients
  tertiary: '#5D1D00',      // Deepest orange/brown for text contrast
  neutral: '#FFFFFE',       // Pure white — main background
  neutralLight: '#FFFEFA',  // Near white — secondary backgrounds
  white: '#FFFFFE',
  black: '#000000',         // True black for max contrast
  gray: '#757575',
  grayLight: '#F1F1F1',     // Light gray (User requested)
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  overlay: 'rgba(0,0,0,0.6)',

  // Gradients (use with expo-linear-gradient)
  primaryGradient: ['#FF6D00', '#C43C00'] as [string, string],
  darkGradient: ['#C43C00', '#5D1D00'] as [string, string],
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
};
