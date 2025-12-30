'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Building2, ChevronDown, Plus, Settings, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function OrganizationSwitcher() {
    const router = useRouter()
    const {
        currentOrganization,
        currentRole,
        organizations,
        isLoadingOrgs,
        switchOrganization,
        isAdmin
    } = useOrganization()

    const [isSwitching, setIsSwitching] = useState(false)

    const handleSwitch = async (orgId: string) => {
        if (orgId === currentOrganization?.organization_id) return

        setIsSwitching(true)
        try {
            await switchOrganization(orgId)
            // Refresh the current page to load new organization data
            router.refresh()
        } finally {
            setIsSwitching(false)
        }
    }

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case 'owner':
                return 'default'
            case 'admin':
                return 'secondary'
            case 'librarian':
                return 'outline'
            default:
                return 'outline'
        }
    }

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'owner':
                return 'Owner'
            case 'admin':
                return 'Admin'
            case 'librarian':
                return 'Librarian'
            case 'member':
                return 'Member'
            default:
                return role
        }
    }

    if (isLoadingOrgs) {
        return (
            <Button variant="outline" disabled className="w-[200px]">
                <Building2 className="mr-2 h-4 w-4" />
                Loading...
            </Button>
        )
    }

    if (!currentOrganization) {
        return (
            <Button
                variant="outline"
                onClick={() => router.push('/org/select')}
                className="w-[200px]"
            >
                <Plus className="mr-2 h-4 w-4" />
                Join or Create Org
            </Button>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className="w-[200px] justify-between"
                    disabled={isSwitching}
                >
                    <span className="flex items-center truncate">
                        <Building2 className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{currentOrganization.name}</span>
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[240px]" align="end">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Organizations</span>
                    {currentRole && (
                        <Badge variant={getRoleBadgeVariant(currentRole)} className="text-xs">
                            {getRoleLabel(currentRole)}
                        </Badge>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {organizations.map((org) => (
                    <DropdownMenuItem
                        key={org.organization_id}
                        onClick={() => handleSwitch(org.organization_id)}
                        className="flex items-center justify-between cursor-pointer"
                    >
                        <span className="flex items-center truncate">
                            <Building2 className="mr-2 h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{org.name}</span>
                        </span>
                        {org.is_current && (
                            <span className="text-xs text-muted-foreground">Current</span>
                        )}
                    </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />

                {isAdmin && (
                    <>
                        <DropdownMenuItem
                            onClick={() => router.push('/org/members')}
                            className="cursor-pointer"
                        >
                            <Users className="mr-2 h-4 w-4" />
                            Manage Members
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => router.push('/org/settings')}
                            className="cursor-pointer"
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            Organization Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </>
                )}

                <DropdownMenuItem
                    onClick={() => router.push('/org/create')}
                    className="cursor-pointer"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Organization
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
