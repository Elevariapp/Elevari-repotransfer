# UI_COMPONENT_LIBRARY.md — Component Inventory

**Repository:** `elevari-2026` (Elevari hospitality platform)
Última validación: 2026-11-21 · rama chore/elevari-production

## Overview

This document is the inventory of all UI components in the Elevari codebase. It includes base UI components, feature components, layout components, and analytics/marketing components. Each entry lists location, status, props, and usage notes.

**Owner:** Design Team
**Phase:** 3E (Complete)

## Base UI Components (`components/ui/`)

| Component | Location | Status | Key Props | Notes |
|-----------|----------|--------|-----------|-------|
| Button | `components/ui/button.tsx` | Complete | variant, size, disabled, onClick, children | Primary, secondary, ghost, danger, outline variants |
| Input | `components/ui/input.tsx` | Complete | type, label, error, disabled, value, onChange | Text, email, number, password, tel types |
| Card | `components/ui/card.tsx` | Complete | children, padding, shadow, className | Property cards, info cards, containers |
| Badge | `components/ui/badge.tsx` | Complete | variant, children | Status badges, labels, tags |
| Avatar | `components/ui/avatar.tsx` | Complete | src, alt, size, fallback | User/host profile images, initials fallback |
| Checkbox | `components/ui/checkbox.tsx` | Complete | checked, onChange, label, disabled | Forms, filters, terms acceptance |
| Radio | `components/ui/radio.tsx` | Complete | value, onChange, label, disabled | Selection groups, single choice |
| Select | `components/ui/select.tsx` | Complete | options, value, onChange, disabled | Dropdown selects, country, currency |
| Dialog | `components/ui/dialog.tsx` | Complete | open, onOpenChange, children, title | Modals, confirmations, forms |
| DropdownMenu | `components/ui/dropdown-menu.tsx` | Complete | trigger, children | Context menus, user menus, actions |
| Tabs | `components/ui/tabs.tsx` | Complete | value, onValueChange, children, trigger | Tabbed interfaces, settings |
| Separator | `components/ui/separator.tsx` | Complete | orientation, decorative | Visual dividers, section breaks |
| ScrollArea | `components/ui/scroll-area.tsx` | Complete | children, className | Custom scroll containers, overflow |
| Tooltip | `components/ui/tooltip.tsx` | Complete | content, side, open | Hover tooltips, helper text |
| Popover | `components/ui/popover.tsx` | Complete | open, onOpenChange, children, trigger | Floating content, dropdowns |
| Sheet | `components/ui/sheet.tsx` | Complete | open, onOpenChange, children | Mobile drawers, side panels |
| Command | `components/ui/command.tsx` | Complete | children, onValueChange | Command palette, search |
| CommandDialog | `components/ui/command-dialog.tsx` | Complete | open, onOpenChange | Command palette in dialog |
| CommandEmpty | `components/ui/command-empty.tsx` | Complete | children | Empty state for command palette |
| CommandGroup | `components/ui/command-group.tsx` | Complete | children | Group of command items |
| CommandInput | `components/ui/command-input.tsx` | Complete | value, onValueChange | Search input for command palette |
| CommandItem | `components/ui/command-item.tsx` | Complete | children, onSelect, disabled | Individual command item |
| CommandList | `components/ui/command-list.tsx` | Complete | children | List of command items |
| CommandSeparator | `components/ui/command-separator.tsx` | Complete | children | Separator in command list |
| Shortcut | `components/ui/shortcut.tsx` | Complete | children | Keyboard shortcut display |
| AspectRatio | `components/ui/aspect-ratio.tsx` | Complete | children, ratio, className | Maintain aspect ratio for media |
| Skeleton | `components/ui/skeleton.tsx` | Complete | className | Loading placeholders |
| Sonner | `components/ui/sonner.tsx` | Complete | toast, useToast | Toast notifications |
| Table | `components/ui/table.tsx` | Complete | children, className | Data tables, admin views |
| TableBody | `components/ui/table-body.tsx` | Complete | children | Table body |
| TableCell | `components/ui/table-cell.tsx` | Complete | children, className | Table cell |
| TableHead | `components/ui/table-head.tsx` | Complete | children | Table header |
| TableHeader | `components/ui/table-header.tsx` | Complete | children | Table header cell |
| TableRow | `components/ui/table-row.tsx` | Complete | children | Table row |
| TableCaption | `components/ui/table-caption.tsx` | Complete | children | Table caption |
| Toaster | `components/ui/toaster.tsx` | Complete | position, richColors | Toast container |
| UseToast | `components/ui/use-toast.ts` | Complete | hook | Toast hook |

## Feature Components

### Catalog Components

| Component | Location | Status | Key Props | Notes |
|-----------|----------|--------|-----------|-------|
| PropertyCard | `components/catalog/property-card.tsx` | Complete | property, onClick, className | Property listing card with image, title, price, rating |
| PropertyGallery | `components/catalog/property-gallery.tsx` | Complete | images, currentIndex, onChange | Image gallery with lightbox, thumbnails |
| PropertyFilters | `components/catalog/property-filters.tsx` | Complete | filters, onChange | Location, dates, guests, price range |
| PropertyList | `components/catalog/property-list.tsx` | Complete | properties, onPropertyClick | Grid/list of property cards |
| PropertyMap | `components/catalog/property-map.tsx` | Complete | properties, onPropertyClick | Map view with property markers |

### Booking Components

| Component | Location | Status | Key Props | Notes |
|-----------|----------|--------|-----------|-------|
| BookingForm | `components/booking/booking-form.tsx` | Complete | propertyId, onSubmit, onCancel | Dates, guests, pricing breakdown, submit |
| DatePicker | `components/booking/date-picker.tsx` | Complete | selected, onChange, minDate, maxDate | Calendar date selection |
| GuestSelector | `components/booking/guest-selector.tsx` | Complete | guests, onChange | Adults, children, infants count |
| PricingBreakdown | `components/booking/pricing-breakdown.tsx` | Complete | nightlyRate, nights, fees, taxes | Itemized pricing with fees and taxes |
| AvailabilityCalendar | `components/booking/availability-calendar.tsx` | Complete | propertyId, selectedDates | Calendar showing available/unavailable dates |

### Checkout Components

| Component | Location | Status | Key Props | Notes |
|-----------|----------|--------|-----------|-------|
| CheckoutForm | `components/checkout/checkout-form.tsx` | Complete | bookingData, onSubmit, onCancel | Guest details, payment method, terms |
| PaymentMethod | `components/checkout/payment-method.tsx` | Complete | method, onSelect, loading | Wompi payment method selection |
| GuestDetails | `components/checkout/guest-details.tsx` | Complete | guestData, onChange | Name, email, phone, ID |
| OrderSummary | `components/checkout/order-summary.tsx` | Complete | booking, total | Booking summary before payment |

### Search Components

| Component | Location | Status | Key Props | Notes |
|-----------|----------|--------|-----------|-------|
| SearchForm | `components/search/search-form.tsx` | Complete | onSubmit, initialValues | Location, dates, guests, price filter |
| SearchResults | `components/search/search-results.tsx` | Complete | properties, total, page | Search results with pagination |
| LocationAutocomplete | `components/search/location-autocomplete.tsx` | Complete | value, onChange, onSelect | Location search with suggestions |

### Analytics Components

| Component | Location | Status | Key Props | Notes |
|-----------|----------|--------|-----------|-------|
| AnalyticsDashboard | `components/analytics/analytics-dashboard.tsx` | Complete | dateRange, propertyId | Metrics, charts, attribution data |
| MarketingScripts | `components/analytics/marketing-scripts.tsx` | Complete | none | GA4, Meta Pixel, CAPI initialization |
| AttributionWidget | `components/analytics/attribution-widget.tsx` | Complete | campaignId, source | Attribution tracking display |
| OccupancyChart | `components/analytics/occupancy-chart.tsx` | Complete | data, dateRange | Occupancy rate visualization |
| RevenueChart | `components/analytics/revenue-chart.tsx` | Complete | data, dateRange | Revenue visualization |

### Theme Components

| Component | Location | Status | Key Props | Notes |
|-----------|----------|--------|-----------|-------|
| ThemeProvider | `components/theme/theme-provider.tsx` | Complete | children | Theme context provider |
| ThemeToggle | `components/theme/theme-toggle.tsx` | Complete | className | Light/dark mode switch |
| useTheme | `components/theme/use-theme.ts` | Complete | hook | Theme hook |

### Brand Components


## Component Usage Guidelines

### Import Pattern

```tsx
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/catalog/property-card";
```

### Component Composition

- Base UI components are atomic and unstyled (use design tokens)
- Feature components compose base components with business logic
- Layout components compose feature components into pages
- Never import feature components inside base UI components

### Props Convention

- All components accept `className` for custom styling
- Event handlers use `onXxx` naming (onClick, onChange, onSubmit)
- Boolean props use positive naming (disabled, not enabled)
- Children prop for content composition

### Accessibility Requirements

- All interactive components have accessible names
- All components support keyboard navigation
- Focus visible styles on all interactive elements
- ARIA attributes where semantic HTML is insufficient
- Color contrast meets WCAG AA (4.5:1 normal, 3:1 large)

## Related Documents

- `EXS_GUIDE.md` — Experience System (tokens, components, a11y)
- `DESIGN_SYSTEM.md` — Design tokens, color, typography, spacing
- `ACCESSIBILITY_GUIDE.md` — WCAG AA compliance & a11y testing
- `BRAND_SYSTEM.md` — Brand identity, logo, colors, voice
- `ARCHITECTURE.md` — System architecture & tech stack
| Component | Location | Status | Key Props | Notes |
|-----------|----------|--------|-----------|-------|
| BrandLogo | `components/brand/brand-logo.tsx` | Complete | variant, size, className | Elevari logo (wordmark, icon, combined) |
| BrandIcon | `components/brand/brand-icon.tsx` | Complete | name, size, color | Brand-specific icons |

### Layout Components

| Component | Location | Status | Key Props | Notes |
|-----------|----------|--------|-----------|-------|
| Header | `components/layout/header.tsx` | Complete | className | Navigation, auth, search, user menu |
| Footer | `components/layout/footer.tsx` | Complete | className | Links, legal, social, newsletter |
| MainLayout | `components/layout/main-layout.tsx` | Complete | children | Wrapper with header + footer |
| Sidebar | `components/layout/sidebar.tsx` | Complete | open, onOpenChange, children | Navigation sidebar (admin/host) |
| Breadcrumb | `components/layout/breadcrumb.tsx` | Complete | items, className | Breadcrumb navigation |
| Container | `components/layout/container.tsx` | Complete | children, className | Max-width centered container |