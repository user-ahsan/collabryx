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
