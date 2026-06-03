/**
 * Acts Design System
 * 
 * Comprehensive spacing, typography, shadows, and component guidelines
 * for creating a polished, modern mobile app
 */

// ============================================================================
// SPACING SCALE (8px base)
// ============================================================================

export const spacing = {
  xs: 4,      // Extra small (gap, padding for badges)
  sm: 8,      // Small (padding, gaps)
  md: 12,     // Medium (card padding, list gaps)
  lg: 16,     // Large (screen padding, major sections)
  xl: 24,     // Extra large (section spacing)
  '2xl': 32,  // 2X Large
  '3xl': 48,  // 3X Large
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  // Headings
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
    letterSpacing: -0.2,
  },
  // Body text
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  // Labels & captions
  label: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    letterSpacing: 0.4,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  captionSmall: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
  },
} as const;

// ============================================================================
// SHADOWS (iOS style, subtle depth)
// ============================================================================

export const shadows = {
  // Subtle elevation
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
  none: 0,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 999,
} as const;

// ============================================================================
// COMPONENT PATTERNS
// ============================================================================

export const components = {
  // Cards (AppCard)
  card: {
    padding: spacing.md,
    borderRadius: borderRadius['3xl'],
    shadow: shadows.sm,
  },

  // Buttons (AppButton)
  button: {
    default: {
      height: 52,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.xl,
      shadow: shadows.xs,
    },
    compact: {
      height: 40,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.lg,
      shadow: shadows.none,
    },
  },

  // Input fields
  input: {
    height: 48,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
  },

  // List items
  listItem: {
    minHeight: 56,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },

  // Modals
  modal: {
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
  },

  // Tabs
  tab: {
    padding: spacing.lg,
    gap: spacing.sm,
  },

  // Bottom sheet
  bottomSheet: {
    borderRadius: borderRadius['3xl'],
    padding: spacing.lg,
    maxHeightPercent: 0.9,
  },
};

// ============================================================================
// LAYOUT PATTERNS
// ============================================================================

export const layouts = {
  // Screen padding
  screenHorizontal: spacing.lg,
  screenVertical: spacing.lg,

  // Section spacing
  sectionGap: spacing.xl,

  // List item gap
  listItemGap: spacing.sm,

  // Card gaps
  cardPaddingHorizontal: spacing.md,
  cardPaddingVertical: spacing.md,

  // Spacing between major sections
  screenSectionGap: spacing['2xl'],
};

// ============================================================================
// ANIMATION DURATIONS (ms)
// ============================================================================

export const animations = {
  fast: 150,      // Micro interactions (button press, toggle)
  normal: 250,    // Standard (screen transitions, fades)
  slow: 350,      // Emphasis (loading states, reveals)
  verySlow: 500,  // Background animations
};

// ============================================================================
// ACCESSIBILITY
// ============================================================================

export const a11y = {
  minTouchTarget: 44, // Minimum touch target size (iOS/Android guidelines)
  minTextSize: 12,    // Minimum readable text size
  minContrast: 4.5,   // WCAG AA contrast ratio
};

// ============================================================================
// Z-INDEX LAYERS (for proper layering)
// ============================================================================

export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  modal: 300,
  popover: 400,
  toast: 500,
} as const;
