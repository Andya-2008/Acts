# Acts UI Design System & Styling Guide

**Last Updated:** May 22, 2026
**Status:** Production Ready
**Components:** 11 (4 new + 7 enhanced)

---

## Overview

Acts now has a **professional, consistent design system** that makes the app feel polished and modern across all screens. Every component uses:
- Proper spacing & typography
- Consistent shadows & depth
- Accessible touch targets
- Smooth animations
- Dark mode support

---

## Core Design Tokens

All in: `shared/theme/designSystem.ts`

### Spacing (8px base)
```typescript
xs:   4px    // Badges, small gaps
sm:   8px    // Padding, list gaps
md:  12px    // Card padding, standard gaps
lg:  16px    // Screen padding, buttons
xl:  24px    // Section spacing
2xl: 32px    // Major section gaps
3xl: 48px    // Screen padding (alt)
```

**Usage:**
```tsx
<View style={{ gap: spacing.md, padding: spacing.lg }}>
  {children}
</View>
```

### Typography Sizes
```typescript
h1:  32px, 700 weight, -0.5 letter spacing   // Page titles
h2:  28px, 700 weight, -0.3 letter spacing   // Section headers
h3:  24px, 600 weight, -0.2 letter spacing   // Card headers (most common)
body: 16px, 400 weight, 24px line height     // Paragraph text
bodyMedium: 16px, 500 weight                 // List item titles
bodySmall: 14px, 400 weight                  // Secondary text
label: 13px, 600 weight, 0.4 tracking        // Button labels
caption: 12px, 400 weight                    // Timestamps, hints
captionSmall: 11px, 500 weight               // Mini badges
```

**Usage:**
```tsx
<AppText variant="h3">Section Title</AppText>
<AppText variant="bodyMedium">Primary text</AppText>
<AppText variant="caption">Secondary text</AppText>
```

### Shadows (iOS-style)
```typescript
none  = No shadow
xs    = Subtle (1px drop, 0.08 opacity)
sm    = Light cards (2px drop, 0.1 opacity)
md    = Medium elevation (4px drop, 0.12 opacity)
lg    = Strong (8px drop, 0.15 opacity)
xl    = Emphasis (12px drop, 0.18 opacity)
```

**Usage:**
```tsx
<View style={shadows.sm}>
  {/* Card content */}
</View>
```

### Border Radius
```typescript
none = 0
sm   = 6px   (small buttons, inputs)
md   = 8px   (moderate buttons)
lg   = 12px  (list items, input fields)
xl   = 16px  (standard buttons)
2xl  = 20px  (modals)
3xl  = 24px  (cards)
full = 999px (badges, avatars)
```

---

## Components

### 1. AppCard (Enhanced)

**Variants:** `default | elevated | outlined | soft`

```tsx
// Default: White background, subtle shadow
<AppCard>
  <AppText variant="h3">Title</AppText>
  <AppText variant="body">Content</AppText>
</AppCard>

// Elevated: Extra shadow for emphasis
<AppCard variant="elevated">
  <AppText>Featured content</AppText>
</AppCard>

// Outlined: Border instead of shadow
<AppCard variant="outlined">
  <AppText>Bordered content</AppText>
</AppCard>

// Soft: Light tinted background
<AppCard variant="soft">
  <AppText>Subtle background</AppText>
</AppCard>
```

**Spacing:**
- Padding: 12px (design system)
- Border radius: 24px
- Shadow: sm (default), md (elevated)

---

### 2. AppButton (Enhanced)

**Variants:** `primary | secondary | ghost | dangerOutline`
**Sizes:** `default (52px) | compact (40px)`

```tsx
// Primary (green, solid)
<AppButton
  title="Save Changes"
  variant="primary"
  size="default"
/>

// Secondary (blue outline)
<AppButton
  title="Cancel"
  variant="secondary"
  size="default"
/>

// Ghost (outline only)
<AppButton
  title="Learn More"
  variant="ghost"
  size="default"
/>

// Danger (red outline for destructive)
<AppButton
  title="Delete"
  variant="dangerOutline"
  size="default"
/>

// Compact (for lists)
<AppButton
  title="Add"
  variant="primary"
  size="compact"
/>
```

**Spacing:**
- Default: 52px height, 14px vertical, 16px horizontal padding
- Compact: 40px height, 8px vertical, 12px horizontal padding
- Border radius: 16px
- Shadow: sm (default), none (compact)

---

### 3. ListItem (NEW)

Clean, modern list rows with optional left/right elements.

```tsx
// Simple
<ListItem
  title="Friend Name"
  subtitle="Added 2 days ago"
/>

// With icons
<ListItem
  title="Achievement Unlocked"
  subtitle="5 minutes ago"
  leftElement={<View style={{ fontSize: 24 }}>🏆</View>}
  rightElement={<AppText variant="label">+100 XP</AppText>}
/>

// Pressable
<ListItem
  title="Profile"
  onPress={() => navigation.navigate('profile')}
  variant="default"
/>

// Bordered variant
<ListItem
  title="Item"
  variant="bordered"
/>

// Subtle variant
<ListItem
  title="Item"
  variant="subtle"
/>
```

**Spacing:**
- Min height: 56px
- Padding: 12px vertical, 16px horizontal
- Gap between elements: 12px

---

### 4. Badge (NEW)

Status labels and tags.

```tsx
// Default
<Badge label="Pending" variant="default" />

// Success
<Badge label="Completed" variant="success" icon="✓" size="md" />

// Warning
<Badge label="Needs Review" variant="warning" />

// Danger
<Badge label="Error" variant="danger" />

// Info
<Badge label="New Feature" variant="info" size="sm" />
```

**Sizes:**
- `sm`: 12px text, compact padding
- `md`: 14px text, normal padding

---

### 5. Section (NEW)

Organize screens into logical sections.

```tsx
<Section
  title="Leaderboard"
  subtitle="Your global rank"
>
  <FlatList data={leaderboard} {...} />
</Section>

<Section
  title="Recent Activity"
  withMargin={true}
>
  {activityItems}
</Section>
```

**Spacing:**
- Gap between title and content: 12px
- Bottom margin when `withMargin=true`: 24px

---

### 6. EmptyState (NEW)

Beautiful empty screen states.

```tsx
<EmptyState
  icon="🔔"
  title="No Notifications Yet"
  description="You're all caught up!"
  actionLabel="Refresh"
  onAction={() => refetch()}
/>
```

**Layout:**
- Centered with flexGrow
- Icon: 64px
- Title spacing: 12px
- Action button: maxWidth 200px, top margin 16px

---

### 7. AppText (Enhanced)

Now supports 11 variants for complete typography system.

```tsx
// Headings
<AppText variant="h1">Page Title</AppText>
<AppText variant="h2">Section Title</AppText>
<AppText variant="h3">Card Title</AppText>

// Body
<AppText variant="body">Regular paragraph</AppText>
<AppText variant="bodyMedium">List item title</AppText>
<AppText variant="bodySmall">Helper text</AppText>

// Labels
<AppText variant="label">BUTTON LABEL</AppText>

// Captions
<AppText variant="caption">Timestamp</AppText>
<AppText variant="captionSmall">Badge text</AppText>
```

---

## Screen Layout Pattern

All screens follow this structure for consistency:

```tsx
export default function MyScreen() {
  const act = useActAppearance();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: act.palette.canvas }}>
      {/* Header */}
      <View style={{ paddingHorizontal: layouts.screenHorizontal, marginBottom: spacing.lg }}>
        <AppText variant="h2">Screen Title</AppText>
      </View>

      {/* Content sections */}
      <FlatList
        data={data}
        renderItem={({ item }) => (
          <Section title="Section Title" withMargin={true}>
            <ListItem title={item.title} />
          </Section>
        )}
        keyExtractor={(item) => item.id}
        scrollEnabled={true}
        contentContainerStyle={{ paddingHorizontal: layouts.screenHorizontal, paddingBottom: spacing.lg }}
      />
    </SafeAreaView>
  );
}
```

**Key spacings:**
- Screen horizontal padding: 16px
- Screen vertical padding: 16px
- Section gap: 24px
- List item gap: 8px

---

## Color Usage

### Text Colors
```typescript
act.palette.ink        // Primary text (dark gray/black)
act.palette.muted      // Secondary text (lighter gray)
act.palette.green      // Accent/interactive (green)
act.palette.blue       // Secondary accent (blue)
act.palette.danger     // Error states (red)
act.palette.border     // Subtle borders
```

### Background Colors
```typescript
act.palette.canvas     // Screen background (lightest)
act.palette.surface    // Card/component background
act.palette.greenSoft  // Tinted backgrounds (soft green)
act.palette.blueSoft   // Tinted backgrounds (soft blue)
```

---

## Common Patterns

### Spaced section with title and list
```tsx
<View style={{ paddingHorizontal: layouts.screenHorizontal, marginBottom: layouts.sectionGap }}>
  <AppText variant="h3" style={{ color: act.palette.ink, marginBottom: spacing.md }}>
    Title
  </AppText>
  <FlatList
    data={items}
    renderItem={({ item }) => <ListItem {...item} />}
    scrollEnabled={false}
    gap={spacing.sm}
  />
</View>
```

### Header with badge
```tsx
<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
  <AppText variant="h3">Title</AppText>
  <Badge label="3 new" variant="success" size="sm" />
</View>
```

### Centered card
```tsx
<View style={{ alignItems: 'center', paddingHorizontal: layouts.screenHorizontal }}>
  <AppCard variant="soft">
    <AppText variant="body" style={{ textAlign: 'center' }}>
      Content
    </AppText>
  </AppCard>
</View>
```

---

## Animations (Next Phase)

Planned smooth animations to add polish:

```typescript
// Fade in on screen load
export const animations = {
  fast: 150ms      // Button presses, toggles
  normal: 250ms    // Screen transitions, fades
  slow: 350ms      // Loading states
  verySlow: 500ms  // Background animations
}
```

---

## Dark Mode

All components automatically respect the app's appearance system:

```typescript
// Colors automatically adjust based on:
// - useActAppearance() returns theme-aware palette
// - Dark mode: darker backgrounds, lighter text
// - Light mode: lighter backgrounds, darker text

const act = useActAppearance();
const backgroundColor = act.palette.canvas;  // Automatic dark mode
const textColor = act.palette.ink;           // Automatic dark mode
```

---

## Accessibility

Built-in accessibility standards:

✅ **Touch targets:** Minimum 44px (ListItem, Button)
✅ **Text size:** Minimum 12px
✅ **Contrast:** WCAG AA minimum 4.5:1
✅ **Semantic HTML:** AppButton uses `accessibilityRole="button"`
✅ **Max font scaling:** Respects user settings

---

## Best Practices

1. **Always use design system tokens** instead of hardcoded values
   ```tsx
   ❌ paddingHorizontal: 16  // Magic number
   ✅ paddingHorizontal: spacing.lg  // From system
   ```

2. **Prefer components over styling everything manually**
   ```tsx
   ❌ <View style={{ padding: 12, borderRadius: 12 }}>
   ✅ <AppCard>
   ```

3. **Use AppText variants** instead of Text + style
   ```tsx
   ❌ <Text style={{ fontSize: 24, fontWeight: '700' }}>
   ✅ <AppText variant="h3">
   ```

4. **Group related spacing**
   ```tsx
   ❌ View with random gaps
   ✅ <Section title="Title"> for organized groups
   ```

5. **Maintain consistency** across screens
   ```tsx
   ✅ All list screens use ListItem
   ✅ All empty screens use EmptyState
   ✅ All headers use h3 variant
   ```

---

## File Reference

- **Design Tokens:** `shared/theme/designSystem.ts` (6.2KB)
- **Components:** `shared/components/ui/*.tsx` (7 files)
- **Exports:** `shared/components/ui/index.ts`

---

## Migration Guide

If updating existing screens to use new components:

**Before:**
```tsx
<View style={{ padding: 16 }}>
  <Text style={{ fontSize: 24, fontWeight: '700' }}>Title</Text>
  <FlatList
    data={items}
    renderItem={({ item }) => (
      <View style={{ padding: 12, borderRadius: 8 }}>
        <Text>{item.title}</Text>
      </View>
    )}
  />
</View>
```

**After:**
```tsx
<View style={{ paddingHorizontal: layouts.screenHorizontal }}>
  <AppText variant="h3">Title</AppText>
  <FlatList
    data={items}
    renderItem={({ item }) => <ListItem title={item.title} />}
  />
</View>
```

---

## Next Steps

Phase 2 improvements:
- [ ] Add FadeIn/SlideIn animations on screen load
- [ ] Add loading skeleton screens
- [ ] Add haptic feedback on button presses
- [ ] Improve dark mode color contrast
- [ ] Add transition animations between screens

---

## Questions?

Check:
1. `shared/theme/designSystem.ts` — All tokens defined here
2. `shared/components/ui/` — Implementation of each component
3. Existing screens — See how components are used in practice

Good design = Consistency = Professional look! 🎨
