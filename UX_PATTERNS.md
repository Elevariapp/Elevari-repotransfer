# UX_PATTERNS.md — UX Patterns & Interaction Guidelines

**Repository:** `elevari-2026` (Elevari hospitality platform)
Última validación: 2026-11-21 · rama chore/elevari-production

## Overview

This document defines Elevari's UX patterns: user flows, interaction guidelines, form patterns, error handling, loading states, and empty states. All new features must follow these patterns.

**Owner:** Design Team
**Phase:** 3E (Complete)

## User Flows

### Guest Booking Flow

1. **Discovery** — Guest lands on home page, browses property catalog
2. **Search** — Guest filters by location, dates, guests, price
3. **Property Detail** — Guest views property details, gallery, amenities, availability
4. **Booking** — Guest selects dates, number of guests, reviews pricing breakdown
5. **Checkout** — Guest enters guest details, payment method, confirms booking
6. **Payment** — Guest redirected to Wompi hosted checkout, completes payment
7. **Confirmation** — Booking confirmed, email sent, guest redirected to confirmation page
8. **Post-Booking** — Guest can view booking in account, receive reminders

### Host Onboarding Flow

1. **Become Host** — Host clicks "Become a Host" from nav or home page
2. **Property Creation** — Host enters property details, location, type, capacity
3. **Media Upload** — Host uploads property photos and videos
4. **Pricing** — Host sets nightly rate, cleaning fee, taxes
5. **Availability** — Host sets calendar availability
6. **Review** — Admin reviews property submission

## Form Patterns

### Form Structure

```
<form>
  <FieldGroup>
    <Label>Field label</Label>
    <Input type="text" required />
    <HelperText>Optional helper text</HelperText>
    <ErrorMessage>Validation error message</ErrorMessage>
  </FieldGroup>
  <Button type="submit">Action</Button>
</form>
```

### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| Email | Required, valid email format | "Please enter a valid email address" |
| Password | Required, min 8 characters | "Password must be at least 8 characters" |
| Name | Required, min 2 characters | "Please enter your full name" |
| Phone | Required, valid phone format | "Please enter a valid phone number" |
| Dates | Required, check-in before check-out | "Check-out date must be after check-in date" |
| Guests | Required, min 1, max property capacity | "Number of guests exceeds property capacity" |

### Form States


## Error Handling

### Inline Validation Errors

- Displayed directly below the field
- Red text (`color-error`), small font (`text-sm`)
- Appears on blur or submit
- Disappears when user corrects the field

### Global Errors

- Toast notification at top-right
- Red background, white text
- Auto-dismiss after 5 seconds
- Action button optional (e.g., "Retry", "Dismiss")

### API Error Mapping

| HTTP Status | User Message | Action |
|-------------|--------------|--------|
| 400 | "Invalid request. Please check your input." | Show inline errors |
| 401 | "Please log in to continue." | Redirect to login |
| 403 | "You don't have permission to do this." | Show error toast |
| 404 | "Not found." | Show 404 page |
| 409 | "This action conflicts with current state." | Show error toast |
| 422 | "Validation failed. Please correct errors." | Show inline errors |
| 429 | "Too many requests. Please try again later." | Show error toast |
| 500 | "Something went wrong. Please try again." | Show error toast |
| 503 | "Service temporarily unavailable." | Show error toast |

## Loading States

### Page-Level Loading

- Skeleton screen matching content layout
- Gray shimmer animation
- No content shift when data loads

### Component-Level Loading

- Spinner inside button or card
- Button disabled during loading
- Text changes to "Loading..." or "Submitting..."


## Navigation Patterns

### Header Navigation

- Logo on left (links to home)
- Primary nav links in center
- User actions on right (login, profile, host dashboard)
- Mobile: hamburger menu, drawer from right

### Breadcrumbs

- Used on property detail and nested pages
- Format: Home > Category > Current Page
- Clickable links except current page

### Pagination

- Used on property listings, admin tables
- Show: Previous, page numbers, Next
- Current page highlighted
- Max 5 page numbers visible

## Modal & Dialog Patterns

### Confirmation Dialog

- Title: "Are you sure?"
- Description: What will happen
- Primary button: Destructive action (red)
- Secondary button: Cancel (gray)
- Click outside to cancel (optional)
- Escape key to close

### Information Dialog

- Title: Descriptive
- Content: Information to display
- Primary button: "OK" or "Got it"
- Click outside to close
- Escape key to close

## Related Documents

- `EXS_GUIDE.md` — Experience System (tokens, components, a11y)
- `UI_COMPONENT_LIBRARY.md` — Component inventory, usage, props
- `DESIGN_SYSTEM.md` — Design tokens, color, typography, spacing
- `ACCESSIBILITY_GUIDE.md` — WCAG AA compliance & a11y testing
- `ARCHITECTURE.md` — System architecture & tech stack
### Skeleton Patterns

| Component | Skeleton |
|-----------|----------|
| Property card | Image box + title lines + price line |
| Property detail | Image gallery + info sections + booking form |
| Dashboard | Metric cards + chart placeholders + list items |
| Search results | Property card skeletons in grid |

## Empty States

### Empty Search Results

- Illustration or icon
- Heading: "No properties found"
- Subheading: "Try adjusting your filters or dates"
- Action: "Clear filters" button

### Empty Bookings

- Illustration or icon
- Heading: "No bookings yet"
- Subheading: "Start planning your next stay"
- Action: "Browse properties" button

### Empty State Pattern

```
[Illustration]
[Heading - sentence case]
[Subheading - sentence case, smaller]
[Primary action button - optional]
[Secondary link - optional]
```

## Success States

### Confirmation Pattern

- Green checkmark icon
- Heading: "Success!" or specific confirmation
- Subheading: Details of what was completed
- Action: Primary button (e.g., "View Booking", "Continue Shopping")
- Optional: Secondary link (e.g., "Share", "Print")

### Toast Success

- Green background, white text
- Auto-dismiss after 3 seconds
- Position: top-right
| State | Visual | Behavior |
|-------|--------|----------|
| Default | Normal border | No feedback |
| Focus | Blue ring, border accent | Focus ring visible |
| Filled | Normal border | Value present |
| Error | Red border, error message below | Inline validation message |
| Disabled | Gray background, gray text | Not interactive |
| Loading | Spinner inside button | Button disabled during submit |
7. **Publish** — Property goes live, host can accept bookings

### Auth Flow

1. **Login** — User enters email/password, submits to `/api/v1/auth/login`
2. **JWT Issued** — API returns JWT, stored in `elevari_token` cookie
3. **Protected Route** — Middleware checks cookie on `/host`, `/account`, `/admin`
4. **API Call** — Frontend sends JWT in `Authorization: Bearer <token>` header
5. **Logout** — Cookie cleared, session invalidated