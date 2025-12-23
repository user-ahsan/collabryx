**Collabryx** **Frontend** **Blueprint** **&** **Implementation**
**Guide**

**1.** **High-Level** **Architecture**

Framework: Next.js 16 (App Router)

UI Library: shadcn/ui (Radix Primitives + Tailwind CSS) Styling:
Tailwind CSS 4

Icons: Lucide React

Routing Strategy: Route Groups ((public), (auth)) to separate layouts.
**2.** **Global** **Layout** **&** **Directory** **Structure**

The application is divided into two distinct worlds: the **Public**
**Marketing** **Side** and the **Authenticated** **App** **Side**.

**Directory** **Tree**

app/

├── layout.tsx ├── globals.css

├── (public)/

> \# Root Layout (Providers: Theme, Toast, QueryClient) \# Global
> Tailwind styles

\# Marketing & Auth Pages

│ ├── layout.tsx │ ├── page.tsx

│ ├── login/page.tsx

\# Navbar + Footer Layout \# Landing Page (/)

> \# Login Form (/login)

│ └── register/page.tsx \# Register Form (/register)

└── (auth)/

> ├── layout.tsx

\# Protected App Pages

> \# App Shell (Sidebar + Topbar)
>
> ├── onboarding/page.tsx
>
> ├── dashboard/page.tsx
>
> \# User Setup Wizard (/onboarding)

\# Main Feed (/dashboard)

> ├── matches/page.tsx ├── assistant/page.tsx
>
> ├── messages/
>
> \# Semantic Match Finder (/matches)

\# AI Mentor Chat (/assistant)

> │ ├── page.tsx
>
> │ └── \[id\]/page.tsx

\# Empty State (/messages)

> \# Active Chat Room (/messages/123)
>
> └── profile/
>
> └── \[id\]/page.tsx \# User Profile View (/profile/123)

**3.** **Page-by-Page** **Blueprint** **A.** **Landing** **Page**

Route: /

Goal: Convert visitors into users.

Layout: Full-width, large typography, "Hero" section. ● **Key**
**Sections:**

> 1\. **Hero:** Large Headline ("Connect with Purpose"), Subtext, and
> two CTA buttons ("Get Started", "Learn More").
>
> 2\. **Features** **Grid:** 3-column layout highlighting "AI Matching",
> "Mentorship", and "Networking".
>
> 3\. **Social** **Proof:** Simple ticker of "Trusted by students
> from..." ● **Shadcn** **Components:**
>
> ○ Button (Variants: default for primary CTA, outline for secondary) ○
> Card (For feature highlights)
>
> ○ NavigationMenu (For the top header) ● **Responsiveness:**
>
> ○ **Desktop:** 3-column feature grid.
>
> ○ **Mobile:** Stacked 1-column layout. Hamburger menu for navigation.

**B.** **Authentication** **Pages** **(Login** **/** **Register)**

Routes: /login, /register

Goal: Clean, distraction-free entry.

Layout: Centered Flexbox container. A single "Card" floating in the
middle of the screen. ● **Components:**

> ○ **AuthCard:** A wrapper component containing the form. ○
> **SocialAuth:** "Continue with Google/GitHub" buttons.
>
> ● **Shadcn** **Components:**
>
> ○ Card, CardHeader, CardTitle, CardContent, CardFooter ○ Form (React
> Hook Form wrapper)
>
> ○ Input (Email/Password) ○ Button (Full width)
>
> ○ Separator (For "Or continue with") ○ Label

**C.** **Onboarding** **Wizard**

Route: /onboarding

Goal: Collect initial profile data (Role, Skills, Bio) to generate
embeddings. Layout: Focused layout (No sidebar). Progress bar at the
top.

> ● **Structure:**
>
> ○ **Step** **1:** **Identity:** Role selection (Student, Founder,
> Professional). ○ **Step** **2:** **Skills:** Tag input for skills.
>
> ○ **Step** **3:** **Bio:** Textarea for "About Me" (Crucial for AI). ●
> **Shadcn** **Components:**
>
> ○ Progress (To show % completion) ○ RadioGroup (For role selection)
>
> ○ Textarea (For Bio)
>
> ○ Badge (For selected skills display)
>
> ○ Command (For searching/adding skills) ○ Button ("Next", "Back")

**D.** **App** **Shell** **(The** **(auth)/layout.tsx)**

**Goal:** Persistent navigation for the logged-in user.

> ● **Desktop** **Layout:**
>
> ○ **Sidebar** **(Left,** **Fixed,** **250px):** Logo, Navigation Links
> (Dashboard, Matches, Messages, Assistant), User Profile Dropdown at
> bottom.
>
> ○ **Main** **Content** **(Right,** **Fluid):** Renders the {children}.
> ● **Mobile** **Layout:**
>
> ○ **Topbar:** Logo + Hamburger Button.
>
> ○ **Sheet** **(Drawer):** Hamburger button triggers a Sheet containing
> the sidebar navigation.
>
> ● **Shadcn** **Components:**
>
> ○ Sheet (For mobile sidebar) ○ Avatar (User profile picture)
>
> ○ DropdownMenu (Settings/Logout) ○ ScrollArea (For sidebar content)
>
> ○ Separator

**E.** **Dashboard** **(Home)**

Route: /dashboard

Goal: Quick overview of activity. Layout: Masonry or Grid layout.

> ● **Widgets:**
>
> 1\. **Welcome** **Banner:** "Good morning, \[Name\]". 2. **Stats**
> **Cards:** "Profile Views", "New Matches".
>
> 3\. **Recent** **Activity:** List of recent connection requests or
> messages. ● **Shadcn** **Components:**
>
> ○ Card (Used heavily here)
>
> ○ Skeleton (Loading states for data)
>
> ○ Button (Quick actions like "Find Match") ○ Avatar (In activity feed)

**F.** **Semantic** **Matches**

Route: /matches

Goal: The core AI feature. Browse and connect with potential matches.
Layout: Grid of "Match Cards".

> ● **Custom** **Component:** **MatchCard**
>
> ○ **Header:** User Avatar + Name + Role Badge.
>
> ○ **Body:** Compatibility Score (e.g., "89% Match") rendered as a
> progress ring or bold text. Top 3 common skills.
>
> ○ **Footer:** "Connect" Button + "View Profile" Button. ● **Shadcn**
> **Components:**
>
> ○ Card
>
> ○ Badge (For skills)
>
> ○ Progress (Visualizing match score) ○ Tooltip (Explain why they
> matched) ○ Button
>
> ● **Responsiveness:**
>
> ○ **Desktop:** Grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3). ○
> **Mobile:** Single column stack.

**G.** **Messages** **/** **Chat**

Routes: /messages (List), /messages/\[id\] (Room) Goal: Real-time
communication.

Layout: Two-pane layout (Classic Mail/Chat app style). ● **Layout**
**Logic:**

> ○ **Desktop:** Split view. Left pane = Conversation List (30%). Right
> pane = Active Chat (70%).
>
> ○ **Mobile:**
>
> ■ /messages: Shows List only.
>
> ■ /messages/\[id\]: Shows Chat only (Full screen). ● **Components:**
>
> ○ **ChatList:** Scrollable list of users + last message preview. ○
> **MessageWindow:** Scrollable area for bubbles.
>
> ○ **MessageBubble:** Custom component. Blue/Right for "Me", Gray/Left
> for "Them". ○ **ChatInput:** Text input + Send button.
>
> ● **Shadcn** **Components:**
>
> ○ ScrollArea (Crucial for message scrolling) ○ Avatar
>
> ○ Input or Textarea (Auto-resizing) ○ Button (Icon button for send)

**H.** **AI** **Assistant**

Route: /assistant

Goal: Mentorship chat interface.

Layout: Similar to /messages/\[id\] but focused on single-thread AI
interaction. ● **Visual** **difference:**

> ○ Cleaner, centered interface (like ChatGPT).
>
> ○ Suggest "Prompt Starters" (buttons) if the chat is empty. ●
> **Shadcn** **Components:**
>
> ○ Card (For the "Prompt Starters")
>
> ○ ScrollArea (For streaming text response) ○ Alert (For system
> notices)

**I.** **User** **Profile**

Route: /profile/\[id\]

Goal: Detailed view of a user.

Layout: Standard "Profile Header" + "Content Tabs". ● **Structure:**

> ○ **Header:** Large Banner (optional) + Avatar overlapping. Name,
> Headline, "Connect" button.
>
> ○ **Content:**
>
> ■ **About:** Full Bio.
>
> ■ **Skills:** Large cloud of badges.
>
> ■ **Goals:** List of current objectives. ● **Shadcn** **Components:**
>
> ○ Tabs (To switch between "Overview" and "Experience") ○ Avatar (Large
> size: h-24 w-24)
>
> ○ Badge (Variant: secondary for skills) ○ Separator

**4.** **Routing** **&** **Navigation** **Strategy** **Route**
**Groups**

We use Route Groups to apply different layouts without affecting the URL
structure.

> ● (public) -\> Applies the marketing navbar (Logo + Login button).
>
> ● (auth) -\> Applies the App Sidebar + Authentication Check
> (Middleware protection).

**Navigation** **Menu** **(Sidebar)**

The sidebar navigation links should use the usePathname hook to apply an
"active" state (e.g., darker background) to the current route.

**Links:**

> 1\. **Dashboard** -\> /dashboard 2. **Matches** -\> /matches
>
> 3\. **Messages** -\> /messages 4. **AI** **Mentor** -\> /assistant
>
> 5\. **My** **Profile** -\> /profile/\[my-id\]

**Mobile** **Navigation**

On mobile devices (\< 768px), the Sidebar is **hidden**.

> ● A "Hamburger" menu appears in the top-right header.
>
> ● Clicking it opens a **Shadcn** **Sheet** (Side Drawer) containing
> the exact same navigation links as the desktop sidebar.

**5.** **Responsiveness** **Quality** **Standards** **Desktop** **Mode**
**(\>** **1024px):**

> ● **Fluidity:** Content should be centered with a max-width (e.g.,
> max-w-7xl) to prevent stretching on ultrawide monitors.
>
> ● **Hover** **States:** All interactive elements (buttons, cards, list
> items) must have distinct hover states (hover:bg-accent).
>
> ● **Information** **Density:** Use grids (3-4 columns) to maximize
> screen real estate usage for Matches and Stats.

**Tablet** **Mode** **(768px** **-** **1024px):**

> ● **Sidebar:** Consider collapsing the sidebar to "Icons Only" to save
> space, or keep it full width if space permits.
>
> ● **Grids:** Reduce 3 columns to 2 columns.

**Mobile** **Mode** **(\<** **768px):**

> ● **Touch** **Targets:** All buttons must be at least 44px height
> (Standard Shadcn h-10 or h-11). ● **No** **Horizontal** **Scroll:**
> Ensure w-full and break-words are used to prevent content
>
> spilling.
>
> ● **Stacked** **Layouts:** All flex-row containers should switch to
> flex-col. ● **Navigation:** Exclusively via the Hamburger Sheet.

**6.** **Implementation** **Checklist** **(Frontend** **Only)**

> 1\. **Install** **Shadcn:** npx shadcn-ui@latest init 2. **Add**
> **Primitives:**
>
> npx shadcn-ui@latest add button card input label form separator sheet
> avatar dropdown-menu scroll-area badge progress tabs textarea
> navigation-menu dialog alert skeleton
>
> 3\. **Setup** **Layouts:** Create the (auth)/layout.tsx with the
> Sidebar/Sheet logic. 4. **Build** **Pages:** Create the dummy UI for
> all routes listed above.
