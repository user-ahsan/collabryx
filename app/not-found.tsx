import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 text-center dark:bg-black">
            <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Not Found
            </h2>
            <p className="mb-8 text-zinc-600 dark:text-zinc-400">
                Could not find requested resource
            </p>
            <Link
                href="/"
                className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
                Return Home
            </Link>
        </div>
    )
}
