import { cn } from "@/lib/utils";

interface GridBackgroundProps {
    className?: string;
}

export function GridBackground({ className }: GridBackgroundProps) {
    return (
        <div
            className={cn(
                "absolute inset-0 -z-10 h-full w-full bg-background",
                className
            )}
        >
            <div className="absolute h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]" />
        </div>
    );
}
