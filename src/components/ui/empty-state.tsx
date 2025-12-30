import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface EmptyStateAction {
    label: string
    href?: string
    onClick?: () => void
    variant?: "default" | "gradient" | "outline"
}

interface EmptyStateProps {
    icon: LucideIcon
    title: string
    description: string
    action?: EmptyStateAction
    secondaryAction?: EmptyStateAction
    className?: string
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    secondaryAction,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center py-16 px-4 text-center",
                className
            )}
        >
            {/* Icon with gradient background */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#02FF73]/20 to-[#09ADAA]/20 flex items-center justify-center mb-6">
                <Icon className="h-10 w-10 text-muted-foreground" />
            </div>

            {/* Title */}
            <h3 className="text-xl font-display font-semibold mb-2">
                {title}
            </h3>

            {/* Description */}
            <p className="text-muted-foreground max-w-md mb-6">
                {description}
            </p>

            {/* Actions */}
            {(action || secondaryAction) && (
                <div className="flex flex-col sm:flex-row gap-3">
                    {action && (
                        <Button
                            variant={action.variant || "gradient"}
                            onClick={action.onClick}
                            asChild={!!action.href}
                        >
                            {action.href ? (
                                <Link href={action.href}>{action.label}</Link>
                            ) : (
                                action.label
                            )}
                        </Button>
                    )}
                    {secondaryAction && (
                        <Button
                            variant={secondaryAction.variant || "outline"}
                            onClick={secondaryAction.onClick}
                            asChild={!!secondaryAction.href}
                        >
                            {secondaryAction.href ? (
                                <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
                            ) : (
                                secondaryAction.label
                            )}
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}
