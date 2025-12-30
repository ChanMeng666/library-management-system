import { cn } from "@/lib/utils"

interface LoadingProps {
    size?: "sm" | "default" | "lg"
    className?: string
    text?: string
}

export function Loading({ size = "default", className, text }: LoadingProps) {
    const sizeClasses = {
        sm: "h-6 w-6",
        default: "h-10 w-10",
        lg: "h-16 w-16",
    }

    const borderSizes = {
        sm: "border-2",
        default: "border-3",
        lg: "border-4",
    }

    return (
        <div className={cn("flex flex-col justify-center items-center gap-4", className)}>
            {/* Custom spinner with brand gradient */}
            <div className={cn("relative", sizeClasses[size])}>
                {/* Background ring */}
                <div
                    className={cn(
                        "absolute inset-0 rounded-full border-muted",
                        borderSizes[size]
                    )}
                />
                {/* Animated gradient ring */}
                <div
                    className={cn(
                        "absolute inset-0 rounded-full border-transparent animate-spin",
                        borderSizes[size]
                    )}
                    style={{
                        borderTopColor: "#02FF73",
                        borderRightColor: "#09ADAA",
                    }}
                />
            </div>
            {text && (
                <p className="text-sm text-muted-foreground animate-pulse">
                    {text}
                </p>
            )}
        </div>
    )
}

// Full page loading overlay
export function LoadingOverlay({ text = "Loading..." }: { text?: string }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Loading size="lg" text={text} />
        </div>
    )
}

// Skeleton loader for cards
export function CardSkeleton({ count = 1 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-xl border bg-card animate-pulse"
                >
                    <div className="aspect-[3/4] bg-muted rounded-t-xl" />
                    <div className="p-4 space-y-3">
                        <div className="h-5 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                        <div className="h-4 bg-muted rounded w-full" />
                    </div>
                </div>
            ))}
        </>
    )
}

// Skeleton loader for stat cards
export function StatCardSkeleton({ count = 4 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-xl border bg-card p-6 animate-pulse"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-4 bg-muted rounded w-24" />
                        <div className="h-4 w-4 bg-muted rounded" />
                    </div>
                    <div className="h-8 bg-muted rounded w-16 mb-2" />
                    <div className="h-3 bg-muted rounded w-20" />
                </div>
            ))}
        </>
    )
}

// Skeleton loader for tables
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex gap-4 p-4 border-b">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-4 bg-muted rounded w-1/6" />
                <div className="h-4 bg-muted rounded w-1/6" />
                <div className="h-4 bg-muted rounded w-1/6" />
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/4" />
                    <div className="h-4 bg-muted rounded w-1/6" />
                    <div className="h-4 bg-muted rounded w-1/6" />
                    <div className="h-4 bg-muted rounded w-1/6" />
                </div>
            ))}
        </div>
    )
}
