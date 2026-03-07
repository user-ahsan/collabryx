# Onboarding Flow & Profile Completion

> This document outlines the expected onboarding flow, data gathered, and profile completion calculations.

## Flow & Screens

The onboarding is a multi-step process presented to the user after signing up. It should contain a **Skip** button to optionally bypass the process for now, though core features like matching will be restricted until the profile is sufficiently complete.

### Step 1: Basic Profile (Mandatory for 25%)
- Full Name (Mandatory)
- Display Name (Optional)
- Headline / Role (Mandatory)
- Location (Optional)

### Step 2: Skills & Expertise (Adds 25% -> 50%)
- Select Primary Skills (e.g., React, Python, UI Design) (Mandatory)
- List Proficiency Levels (Optional)

### Step 3: Interests & Goals (Adds 40% -> 90%)
- Select Interests/Industries (e.g., Fintech, EdTech, Web3) (Mandatory)
- Select Collaboration Goals (`looking_for`) (e.g., Co-founder, Open Source, Mentorship) (Mandatory)

### Step 4: Add Experience/Projects (Adds 10% -> 100%)
- Add at least one past experience or project (Optional)
- Link Portfolio/Website (Optional)

## Profile Completion Metrics

* **25%**: Basic Profile completed (Name, Headline)
* **50%**: Skills added
* **90%**: Interests and matching goals defined (Unlocks Matching Engine)
* **100%**: Experience, projects, or external links added

## Authentication & Routing Rules

1. **Routing Check**: After login or signup, check the `onboarding_completed` flag on the `profiles` table.
2. **If False**: Redirect user to `/onboarding`.
3. **Feature Gates**: Matchmaking and personalized feeds require at least 90% profile completion.
4. **Development Mode**: If `process.env.DEVELOPMENT_MODE === 'true'`, the app should allow bypassing the onboarding flow, meaning the auth middleware/checks will not force redirection to `/onboarding`, and users can access the onboarding route directly for testing without strict auth guards.
