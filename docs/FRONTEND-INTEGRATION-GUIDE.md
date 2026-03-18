# Frontend Integration Guide - New Python Worker Endpoints

**Date:** 2026-03-19  
**Branch:** `feature/missing-api-endpoints`

---

## ✅ Implemented Endpoints

### 1. Content Moderation (`POST /api/moderate`)

**Purpose:** Moderate user-generated content for toxicity, spam, NSFW, and PII

**Frontend Hook:** `useContentModeration()` from `hooks/use-new-endpoints.ts`

**Usage Example:**
```tsx
import { useContentModeration } from '@/hooks/use-new-endpoints';

function PostForm() {
  const { moderate, isModerating, canProceed } = useContentModeration();
  
  const handleSubmit = async (content: string) => {
    // Moderate before posting
    const result = await moderate(content, 'post');
    
    if (!canProceed(result)) {
      alert('Content flagged for review');
      return;
    }
    
    // Proceed with posting
    await createPost(content);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <textarea disabled={isModerating} />
      {isModerating && <span>Checking content...</span>}
      <button type="submit" disabled={isModerating}>Post</button>
    </form>
  );
}
```

**Response Handling:**
- `approved: true` - Content is safe, proceed
- `flag_for_review: true` - Content needs manual review
- `auto_reject: true` - Content violates policies, block

---

### 2. AI Mentor (`POST /api/ai-mentor/message`)

**Purpose:** Get AI-powered career and project advice

**Frontend Hook:** `useAIMentor()` from `hooks/use-new-endpoints.ts`

**Usage Example:**
```tsx
import { useAIMentor } from '@/hooks/use-new-endpoints';
import { useUser } from '@/hooks/use-user';

function AIMentorChat() {
  const { user } = useUser();
  const { sendMessage, isLoading, sessionId, clearSession } = useAIMentor();
  const [messages, setMessages] = useState([]);
  
  const handleSend = async (message: string) => {
    const response = await sendMessage(message, user.id);
    
    if (response) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.response,
        action_items: response.action_items,
      }]);
    }
  };
  
  return (
    <ChatInterface
      messages={messages}
      onSend={handleSend}
      isLoading={isLoading}
      onClear={clearSession}
    />
  );
}
```

**Features:**
- Maintains session context across messages
- Returns action items and suggested next steps
- Fallback responses when service unavailable

---

### 3. Daily Analytics (`POST /api/analytics/daily`)

**Purpose:** Get aggregated daily platform metrics (admin only)

**Frontend Hook:** `useAnalytics()` from `hooks/use-new-endpoints.ts`

**Usage Example:**
```tsx
import { useAnalytics } from '@/hooks/use-new-endpoints';

function AdminDashboard() {
  const { getDailyStats, isLoading } = useAnalytics();
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    const loadStats = async () => {
      const data = await getDailyStats();
      if (data?.status === 'success') {
        setStats(data.metrics);
      }
    };
    
    loadStats();
  }, []);
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <Dashboard>
      <MetricCard label="DAU" value={stats?.dau} />
      <MetricCard label="MAU" value={stats?.mau} />
      <MetricCard label="New Users" value={stats?.new_users} />
      <MetricCard label="New Posts" value={stats?.new_posts} />
    </Dashboard>
  );
}
```

**Access Control:**
- Requires admin role (checked in API route)
- Falls back to basic metrics if Python worker unavailable

---

## 🔧 Integration Points

### Where to Use Content Moderation

1. **Post Creation** (`app/(auth)/post/create/page.tsx`)
   - Moderate before submitting post
   - Show warning if flagged

2. **Comment Form** (`components/features/comments/comment-form.tsx`)
   - Moderate comment before posting
   - Display error if rejected

3. **Profile Edit** (`app/(auth)/my-profile/page.tsx`)
   - Moderate bio/headline changes
   - Prevent inappropriate content

4. **Messages** (`app/(auth)/messages/[id]/page.tsx`)
   - Optional: Moderate first message to new connection
   - Skip for ongoing conversations

---

### Where to Use AI Mentor

1. **Assistant Page** (`app/(auth)/assistant/page.tsx`)
   - Main chat interface for AI mentor
   - Display action items and suggestions

2. **Onboarding** (`app/(auth)/onboarding/`)
   - Offer AI guidance during onboarding
   - Help users complete profile

3. **Career Resources** (`app/(auth)/resources/career/page.tsx`)
   - Integrate AI advice with resources
   - Personalized recommendations

---

### Where to Use Analytics

1. **Admin Dashboard** (`app/(auth)/admin/dashboard/page.tsx`)
   - Display platform metrics
   - Show trends over time

2. **Admin Reports** (`app/(auth)/admin/reports/page.tsx`)
   - Generate daily/weekly reports
   - Export data functionality

---

## 🎨 UI Components to Create

### Content Moderation

```tsx
// components/shared/content-moderation-status.tsx
interface Props {
  result: ModerateResponse | null;
  onOverride?: () => void;
}

export function ContentModerationStatus({ result, onOverride }: Props) {
  if (!result) return null;
  
  if (result.auto_reject) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Content Rejected</AlertTitle>
        <AlertDescription>
          Your content violates our community guidelines.
          {result.details.toxicity?.score > 0.7 && ' Contains toxic language.'}
          {result.details.pii?.detected && ' Contains personal information.'}
        </AlertDescription>
      </Alert>
    );
  }
  
  if (result.flag_for_review) {
    return (
      <Alert variant="warning">
        <AlertTitle>Content Under Review</AlertTitle>
        <AlertDescription>
          Your post will appear after moderator approval.
        </AlertDescription>
      </Alert>
    );
  }
  
  return null;
}
```

### AI Mentor Chat

```tsx
// components/features/assistant/mentor-chat.tsx
interface Props {
  userId: string;
}

export function MentorChat({ userId }: Props) {
  const { sendMessage, isLoading, sessionId } = useAIMentor();
  const [messages, setMessages] = useState([]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Career Mentor</CardTitle>
        <CardDescription>
          Get personalized advice on your career and projects
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MessageList messages={messages} />
        <ActionItems items={messages[messages.length - 1]?.action_items} />
        <ChatInput
          onSend={sendMessage}
          isLoading={isLoading}
          placeholder="Ask about career, projects, or skills..."
        />
      </CardContent>
    </Card>
  );
}
```

### Analytics Dashboard

```tsx
// components/features/admin/analytics-dashboard.tsx
export function AnalyticsDashboard() {
  const { getDailyStats } = useAnalytics();
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    loadStats();
  }, []);
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Daily Active Users"
        value={stats?.dau}
        trend="+12%"
      />
      <MetricCard
        title="Monthly Active Users"
        value={stats?.mau}
        trend="+8%"
      />
      <MetricCard
        title="New Users Today"
        value={stats?.new_users}
        trend="+5%"
      />
      <MetricCard
        title="New Posts Today"
        value={stats?.new_posts}
        trend="+15%"
      />
    </div>
  );
}
```

---

## 📋 Testing Checklist

### Content Moderation
- [ ] Test with toxic content (should reject)
- [ ] Test with spam content (should reject)
- [ ] Test with PII (should reject)
- [ ] Test with safe content (should approve)
- [ ] Test fallback when Python worker down
- [ ] Test loading state during moderation
- [ ] Test error handling

### AI Mentor
- [ ] Test career-related questions
- [ ] Test project-related questions
- [ ] Test skill-related questions
- [ ] Test session persistence (follow-up messages)
- [ ] Test fallback responses
- [ ] Test action items display
- [ ] Test suggested next steps

### Analytics
- [ ] Test admin access (should work)
- [ ] Test non-admin access (should fail)
- [ ] Test with valid date parameter
- [ ] Test without date (defaults to today)
- [ ] Test fallback metrics
- [ ] Test loading state
- [ ] Test error handling

---

## 🚀 Deployment Notes

### Environment Variables

Add to `.env.production` on Vercel:
```env
# Python Worker
PYTHON_WORKER_URL=https://your-worker.railway.app

# External APIs (optional)
PERSPECTIVE_API_KEY=your-key
GEMINI_API_KEY=your-key
```

### Feature Flags

Consider adding feature flags for gradual rollout:
```tsx
// lib/config/features.ts
export const FEATURES = {
  CONTENT_MODERATION: process.env.NEXT_PUBLIC_ENABLE_MODERATION === 'true',
  AI_MENTOR: process.env.NEXT_PUBLIC_ENABLE_AI_MENTOR === 'true',
  ANALYTICS_DASHBOARD: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
};
```

---

## 📊 Success Metrics

Track these after deployment:

**Content Moderation:**
- % of content auto-approved
- % flagged for review
- % auto-rejected
- Average moderation time

**AI Mentor:**
- Daily active users
- Messages per session
- Session completion rate
- User satisfaction (thumbs up/down)

**Analytics:**
- Dashboard views per day
- Most viewed metrics
- Admin engagement

---

**Last Updated:** 2026-03-19  
**Status:** Ready for frontend integration
