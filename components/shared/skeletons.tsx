export function PostSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 p-4 animate-pulse">
      <div className="flex items-center space-x-4">
        <div className="h-12 w-12 rounded-full bg-muted" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-3 w-24 bg-muted rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-2/3 bg-muted rounded" />
      </div>
      <div className="flex items-center gap-4 pt-2">
        <div className="h-8 w-16 bg-muted rounded" />
        <div className="h-8 w-16 bg-muted rounded" />
        <div className="h-8 w-16 bg-muted rounded" />
      </div>
    </div>
  )
}

export function PostListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  )
}

export function MatchCardSkeleton() {
  return (
    <div className="w-full max-w-sm mx-auto p-4 animate-pulse">
      <div className="bg-card rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-center">
          <div className="h-24 w-24 rounded-full bg-muted" />
        </div>
        <div className="space-y-2 text-center">
          <div className="h-6 w-48 bg-muted rounded mx-auto" />
          <div className="h-4 w-32 bg-muted rounded mx-auto" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 flex-1 bg-muted rounded" />
          <div className="h-10 flex-1 bg-muted rounded" />
        </div>
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto p-6 animate-pulse">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0">
          <div className="h-32 w-32 rounded-full bg-muted" />
        </div>
        <div className="flex-1 space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-4 w-48 bg-muted rounded" />
          <div className="h-20 w-full bg-muted rounded" />
        </div>
      </div>
      <div className="mt-8 space-y-4">
        <div className="h-6 w-32 bg-muted rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function MessageSkeleton() {
  return (
    <div className="flex-1 p-4 space-y-4 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
        >
          <div className="max-w-[70%] space-y-2">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-12 bg-muted rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="container max-w-7xl mx-auto py-6 px-6">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8">
          <PostListSkeleton count={5} />
        </div>
        <div className="hidden 2xl:block 2xl:col-span-4">
          <div className="sticky top-6 space-y-4">
            <div className="h-64 bg-muted rounded-lg animate-pulse" />
            <div className="h-64 bg-muted rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function NotificationSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
          <div className="h-10 w-10 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-muted rounded" />
            <div className="h-3 w-1/2 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SettingsSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto p-6 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded mb-6" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-2">
              <div className="h-5 w-40 bg-muted rounded" />
              <div className="h-3 w-64 bg-muted rounded" />
            </div>
            <div className="h-10 w-24 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ActivityFeedSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3 animate-pulse">
          <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-3 w-2/3 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SidebarSkeleton() {
  return (
    <div className="w-64 h-full p-4 space-y-4 animate-pulse">
      <div className="h-12 w-full bg-muted rounded" />
      <div className="h-32 w-full bg-muted rounded" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 w-full bg-muted rounded" />
        ))}
      </div>
    </div>
  )
}

export function UserNavSkeleton() {
  return (
    <div className="flex items-center gap-2 animate-pulse">
      <div className="h-8 w-8 rounded-full bg-muted" />
      <div className="h-4 w-24 bg-muted rounded" />
    </div>
  )
}

export function SearchSkeleton() {
  return (
    <div className="w-full max-w-md animate-pulse">
      <div className="h-10 w-full bg-muted rounded-lg" />
    </div>
  )
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full animate-pulse">
      <div className="h-10 w-full bg-muted rounded mb-2" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid gap-4 mb-2" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className="h-10 bg-muted rounded" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="w-full h-64 animate-pulse">
      <div className="h-full w-full bg-muted rounded-lg" />
    </div>
  )
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 border rounded-lg animate-pulse">
          <div className="h-32 bg-muted rounded mb-4" />
          <div className="space-y-2">
            <div className="h-5 w-3/4 bg-muted rounded" />
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-2/3 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-10 w-full bg-muted rounded" />
        </div>
      ))}
      <div className="h-10 w-32 bg-muted rounded" />
    </div>
  )
}

export function ModalSkeleton() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center animate-pulse">
      <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4">
        <div className="h-6 w-48 bg-muted rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-4 w-full bg-muted rounded" />
          ))}
        </div>
        <div className="flex gap-2 mt-6">
          <div className="h-10 flex-1 bg-muted rounded" />
          <div className="h-10 flex-1 bg-muted rounded" />
        </div>
      </div>
    </div>
  )
}

export function TabsSkeleton() {
  return (
    <div className="w-full animate-pulse">
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 w-24 bg-muted rounded" />
        ))}
      </div>
      <div className="h-64 w-full bg-muted rounded" />
    </div>
  )
}

export function CommentSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3 animate-pulse">
          <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-3 w-20 bg-muted rounded" />
            </div>
            <div className="h-16 w-full bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
