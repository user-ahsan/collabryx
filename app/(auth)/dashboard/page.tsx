import { Feed } from "@/components/features/dashboard/feed"
import { SuggestionsSidebar } from "@/components/features/dashboard/suggestions-sidebar"

export default function DashboardPage() {
    return (
        <div className="container max-w-7xl mx-auto py-2 md:py-6 px-2 md:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                <div className="lg:col-span-8 max-w-2xl mx-auto lg:mx-0 lg:max-w-none w-full">
                    <Feed />
                </div>
                <div className="hidden lg:block lg:col-span-4 sticky top-6">
                    <SuggestionsSidebar />
                </div>
            </div>
        </div>
    )
}
