# **1. Navbar + Header**

### Components used

* `shiny-text.tsx` (for logo shimmer)
* `scroll-reveal.tsx` (section fade-in)
* `theme-toggler.tsx` with `animated-theme-toggler.tsx`

### Animations

* **Navbar load-in** using `scroll-reveal`
  * opacity 0 → 1
  * translateY(12px → 0)
* **Logo shimmer** using `shiny-text.tsx` on a slow 8s loop.
* **Theme toggler rotation** from `animated-theme-toggler`.
* **On scroll:**
  * Navbar height shrinks (Framer Motion)
  * Background applies blur
  * Duration: 0.25s

---

# **2. Hero Section**

### Components used

* `globe.tsx`
* `morphing-text.tsx`
* `button.tsx`
* `grid-background.tsx`
* `orbiting-circles.tsx`
* `animated-beam.tsx`

### Animations

* **Globe** : continuous rotation (built-in in `globe.tsx`)
* **Morphing headline** via `morphing-text.tsx`
  * 3–5 rotating phrases with fade+scale blend
* **Background grid** using `grid-background.tsx`:
  * slow parallax tied to scroll
* **Button magnetic hover** using Framer Motion:
  * scale 1 → 1.05 on hover
* **Orbiting circles** : hero halo animation
* **Animated beam** : subtle passing beam through hero card every 12s.

---

# **3. “Loved by Teams Worldwide”**

### Components used

* `marquee.tsx`
* `avatar.tsx`
* `card.tsx`
* `scroll-reveal.tsx`
* `orbiting-circles.tsx` (for decorative movement)

### Animations

* **Logo Marquee** using `marquee.tsx`
  * Infinite horizontal motion
  * Speed: moderate
* **Testimonial cards** with `scroll-reveal`:
  * fade-up with stagger
* **Avatar hover** :
* scale 1 → 1.06
* smooth shadow lift (Framer Motion)

---

# **4. Problem Statements**

### Components used

* `card.tsx`
* `scroll-reveal.tsx`
* `shiny-text.tsx` (optional for headers)

### Animations

* Each problem card uses:
  * `scroll-reveal`
  * 40px → 0 translate
  * opacity 0 → 1
  * stagger: 0.12s
* Emoji stays static
* Title uses **shiny-text** subtle reflection every 7s.

---

# **5. Solution Section

“Traditional Search vs Semantic Search”**

### Components used

* `bento-grid.tsx`
* `card.tsx`
* `scroll-area.tsx`
* `scroll-reveal.tsx`
* `morphing-text.tsx`
* `animated-beam.tsx`

### Animations

* **Left bento panel** (traditional):
  * slide from left  –20px → 0
* **Right bento panel** (semantic):
  * slide from right +20px → 0
* **Highlight match card** :
* pop-in scale 0.95 → 1
* shadow bloom 0.2s
* **Scrolling examples** via `scroll-area.tsx`

---

# **6. “Perfect Match Anatomy”**

### Components used

* `card.tsx`
* `avatar.tsx`
* `orbiting-circles.tsx`
* `shiny-text.tsx`
* `scroll-reveal.tsx`

### Animations

* Two person cards:
  * scroll-reveal fade-up
  * scale: 0.96 → 1
* Compatibility score:
  * Count-up via `CountUp.tsx`
* Orbit rings animate continuously around the profile.
* Title uses shiny-text shimmer.

---

# **7. AI Mentor Chat**

### Components used

* `dialog.tsx`
* `scroll-reveal.tsx`
* `animated-beam.tsx`

### Animations

* Chat card scrolls in gently:
  * 20px translate up
  * opacity from 0 → 1
* Bubble messages:
  * scale 0.9 → 1
  * fade-in stagger
* Typing indicator pulsing opacity loop.

---

# **8. “Built for Every Stage” (Category Cards)**

### Components used

* `card.tsx`
* `scroll-reveal.tsx`
* `progress.tsx`
* `orbiting-circles.tsx`

### Animations

* Cards stagger from bottom (scroll-reveal)
  * 15px → 0 translate
  * stagger 0.1s
* Hover:
  * lift 6px
  * gentle 2° tilt
* Tiny orbiting icons for flair (optional).

---

# **9. Interactive Slider (“Find Your Project Team”)**

### Components used

* `slider.tsx`
* `scroll-area.tsx`
* `scroll-based-velocity.tsx`
* `card.tsx`

### Animations

* Slider active card:
  * fade-crossfade using Framer Motion
  * scale 0.96 → 1
* Slider knob:
  * spring movement
  * overshoot 1.03 → settle to 1
* Auto: background grid shifts using `scroll-based-velocity`.

---

# **10. Features Grid (“Everything You Need…”)**

### Components used

* `bento-grid.tsx`
* `card.tsx`
* `scroll-reveal.tsx`

### Animations

* Grid uses:
  * grid-based stagger
  * fade & rise
* Hover:
  * icon lifts
  * slight color glow
  * label slides up 4px

---

# **11. “Why Teams Choose Collabryx”**

### Components used

* `border-beam.tsx`
* `card.tsx`
* `scroll-reveal.tsx`

### Animations

* Section header tilt 2° → 0° as it fades in
* Cards render:
  * translateY 20px → 0
  * stagger
* Border-beam animates around each card on hover.

---

# **12. Statistics (“Impact That Matters”)**

### Components used

* `CountUp.tsx`
* `card.tsx`
* `scroll-reveal.tsx`
* `fluid-glass.tsx` (optional card style)

### Animations

* Numbers: count-up on visibility
* Cards:
  * scale 0.9 → 1
  * staggered
* Fluid-glass background shifts slowly (CSS animation).

---

# **13. Step-by-Step “How It Works”**

### Components used

* `ScrollStack.tsx`
* `ScrollFloat.tsx`
* `ScrollReveal.tsx`

### Animations

* Use **ScrollStack** to animate slides:
  * Each step slides horizontally on scroll
* **ScrollFloat** :
* small floating amplitude (2–4px)
* slow breathing animation
* **ScrollReveal** for section anchor.

---

# **14. Final CTA**

### Components used

* `button.tsx`
* `shiny-text.tsx`
* `scroll-reveal.tsx`
* `border-beam.tsx`

### Animations

* Section fade-in with slight overshoot
* Button:
  * pop-in
  * on-hover ripple (Framer Motion)
* Shiny-text for heading: soft shimmer
* Border-beam loops every 10s on CTA card.

---

# **15. Footer**

### Components used

* `scroll-reveal.tsx`
* `marquee.tsx` (optional logos)

### Animations

* Fade-in bottom-up
* Slow marquee for partner/funding logos

---

# **GLOBAL ANIMATION SYSTEM**

These components provide **page-wide animations** you should enable:

### **1. Scroll-based reveal**

* `scroll-reveal.tsx`
* `ScrollReveal.tsx`
* `ScrollReveal.css`

Use for all sections and cards.

### **2. Floating animations**

* `ScrollFloat.tsx`
* `ScrollFloat.css`

Apply to decorative items (globe, icons, orbit rings).

### **3. Parallax / velocity**

* `scroll-based-velocity.tsx`

Use for hero backgrounds and feature backgrounds.

### **4. Ambient backgrounds**

* `GridScan.tsx`
* `GridScan.css`
* `Orb.tsx`
* `Orb.css`

These run  **continuously** , no triggers needed.

### **5. Motion wrapper**

* Framer Motion variants shared across:
  * cards
  * sliders
  * dialogs
  * navbars
  * buttons
