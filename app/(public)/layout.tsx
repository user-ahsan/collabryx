import { SmoothCursor } from "@/components/ui/smooth-cursor";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="public-cursor-wrapper min-h-screen flex flex-col">
            <SmoothCursor />
            {children}
        </div>
    );
}
