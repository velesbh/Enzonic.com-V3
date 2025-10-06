# Theme Integration Guide

## Overview

This application features automatic theme detection and synchronization between your app's theme and Clerk authentication UI. The theming system supports three modes:

- **Light mode**: Manually selected light theme
- **Dark mode**: Manually selected dark theme  
- **System mode**: Automatically follows the user's OS theme preference

## How It Works

### 1. Theme Detection
- `useResolvedTheme()` hook resolves the current theme to either "light" or "dark"
- Automatically detects system theme changes in real-time
- Optimized to prevent unnecessary re-renders

### 2. Clerk Theme Synchronization
- `ThemedClerkProvider` wraps the Clerk authentication
- Automatically applies matching theme to all Clerk UI components
- Updates instantly when theme changes

### 3. Theme Configuration
- `getClerkAppearance()` generates Clerk-specific styling
- Uses your app's color palette and design tokens
- Maintains consistency between app and auth UI

## Components

### `useResolvedTheme()`
```tsx
const resolvedTheme = useResolvedTheme(); // "light" | "dark"
```
- Returns the actual theme being used (resolves "system" to "light" or "dark")
- Listens for system preference changes
- Optimized for performance

### `ThemedClerkProvider`
```tsx
<ThemedClerkProvider>
  <YourApp />
</ThemedClerkProvider>
```
- Wraps your app with Clerk authentication
- Automatically applies correct theme to Clerk UI
- Handles theme changes seamlessly

### `getClerkAppearance(isDark: boolean)`
- Generates Clerk appearance configuration
- Matches your app's color scheme
- Includes custom styling for forms, buttons, modals, etc.

## Theme Colors

The system uses these color mappings:

**Light Theme:**
- Background: `hsl(0 0% 100%)` (white)
- Foreground: `hsl(222.2 84% 4.9%)` (dark blue)
- Border: `hsl(214.3 31.8% 91.4%)` (light gray)
- Muted: `hsl(215.4 16.3% 46.9%)` (medium gray)

**Dark Theme:**
- Background: `hsl(222.2 84% 4.9%)` (dark blue)
- Foreground: `hsl(210 40% 98%)` (light)
- Border: `hsl(217.2 32.6% 17.5%)` (dark gray)
- Muted: `hsl(215 20.2% 65.1%)` (medium gray)

## Customization

To customize Clerk theming:

1. **Modify colors** in `src/lib/clerk-appearance.ts`
2. **Add new elements** to the `elements` object
3. **Update variables** in the `variables` object

Example:
```typescript
// In clerk-appearance.ts
variables: {
  colorPrimary: "your-custom-color",
  borderRadius: "your-custom-radius",
}
```

## Automatic Features

✅ **System theme detection** - Follows OS dark/light mode  
✅ **Real-time updates** - Changes instantly when theme switches  
✅ **Performance optimized** - Minimal re-renders  
✅ **Consistent styling** - Matches your app's design  
✅ **Responsive design** - Works on all screen sizes  

## Theme Persistence

Theme preference is automatically saved to localStorage with the key `enzonic-ui-theme` and persists across browser sessions.

## Browser Support

The theming system works in all modern browsers that support:
- CSS custom properties (CSS variables)
- `prefers-color-scheme` media query
- `matchMedia` API