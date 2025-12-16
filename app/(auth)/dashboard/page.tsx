"use client"

import { Feed } from "@/components/features/dashboard/feed"
import { SuggestionsSidebar } from "@/components/features/dashboard/suggestions-sidebar"

export default function DashboardPage() {
    return (
        <div className="container max-w-7xl mx-auto py-6 px-4 md:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">

                {/* Center Column - Feed (8 cols) - Now the main focus */}
                <div className="md:col-span-8 space-y-6">
                    <Feed />
                </div>

                {/* Right Column - Suggestions (4 cols) - Sticky */}
                <div className="md:col-span-4 space-y-6 md:sticky md:top-6">
                    <SuggestionsSidebar />
                </div>

            </div>
        </div>
    )
}
