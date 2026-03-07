# Table: `profiles`

> Core user identity table. 1:1 with `auth.users`. Created on signup.

## Used By

- **Settings Dialog** → Profile tab (display_name, headline, bio)
- **Profile Header** → name, role, avatar, location, website, skills, verification
- **Profile Tabs** → About (bio, looking_for intents), Experience, Projects
- **Dashboard Profile Card** → name, avatar, role
- **Feed Post Header** → author_name, author_role, author_avatar
- **Smart Matches** → name, role, avatar for matched users
- **Onboarding** → initial profile setup (basic info, skills, goals)

## Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | — | PK, FK → `auth.users.id` |
| `email` | `text` | NO | — | Denormalized from auth for quick access |
| `display_name` | `text` | YES | `null` | Public display name |
| `full_name` | `text` | YES | `null` | Full legal name (from signup) |
| `headline` | `text` | YES | `null` | Short role/title (e.g. "Full Stack Developer @ TechStart") |
| `bio` | `text` | YES | `null` | Longer description, shown on profile About tab |
| `avatar_url` | `text` | YES | `null` | URL to profile picture |
| `banner_url` | `text` | YES | `null` | URL to profile banner image |
| `location` | `text` | YES | `null` | e.g. "San Francisco, CA" |
| `website_url` | `text` | YES | `null` | Personal link (github, portfolio) |
| `collaboration_readiness` | `text` | YES | `'available'` | Enum: `available`, `open`, `not-available` |
| `is_verified` | `boolean` | NO | `false` | Whether identity is verified |
| `verification_type` | `text` | YES | `null` | Enum: `student`, `faculty`, `alumni` |
| `university` | `text` | YES | `null` | University name for verified users |
| `profile_completion` | `integer` | NO | `0` | 0–100 percentage |
| `looking_for` | `text[]` | YES | `'{}'` | Array of intent tags: `Technical Co-founder`, `Open Source`, `Mentorship`, `Freelance`, `Startup` |
| `onboarding_completed` | `boolean` | NO | `false` | Has user finished onboarding flow |
| `created_at` | `timestamptz` | NO | `now()` | Row creation |
| `updated_at` | `timestamptz` | NO | `now()` | Last update |

## RLS Policy Notes

- Users can `SELECT` their own row + any public profile.
- Users can `UPDATE` only their own row.
- `INSERT` triggered by auth signup hook / trigger function.

## Frontend Expectations

```ts
// Settings Dialog upserts:
{ id, display_name, headline, bio, updated_at }

// Profile Header reads:
{ display_name, headline, avatar_url, location, website_url,
  collaboration_readiness, is_verified, verification_type, university }

// Feed maps to:
{ author_name: display_name, author_role: headline, author_avatar: avatar_url }
```
