'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from './AuthContext'
import type {
    Organization,
    OrganizationRole,
    UserOrganization,
    OrganizationStats
} from '@/types/supabase'

interface OrganizationContextType {
    // Current organization
    currentOrganization: Organization | null
    currentRole: OrganizationRole | null

    // User's organizations
    organizations: UserOrganization[]
    isLoadingOrgs: boolean

    // Actions
    switchOrganization: (organizationId: string) => Promise<void>
    refreshOrganizations: () => Promise<void>
    createOrganization: (name: string, slug: string, description?: string) => Promise<{ success: boolean; error?: string; organizationId?: string }>

    // Organization stats (for admin dashboard)
    orgStats: OrganizationStats | null
    refreshOrgStats: () => Promise<void>

    // Helpers
    isOwner: boolean
    isAdmin: boolean
    isLibrarian: boolean
    canManageBooks: boolean
    canManageMembers: boolean
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth()

    // Organization state
    const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null)
    const [currentRole, setCurrentRole] = useState<OrganizationRole | null>(null)
    const [organizations, setOrganizations] = useState<UserOrganization[]>([])
    const [isLoadingOrgs, setIsLoadingOrgs] = useState(true)
    const [orgStats, setOrgStats] = useState<OrganizationStats | null>(null)

    // Fetch user's organizations
    const refreshOrganizations = useCallback(async () => {
        if (!user) {
            setOrganizations([])
            setCurrentOrganization(null)
            setCurrentRole(null)
            setIsLoadingOrgs(false)
            return
        }

        try {
            setIsLoadingOrgs(true)

            // Call the get_user_organizations function
            const { data, error } = await supabase.rpc('get_user_organizations')

            if (error) {
                console.error('Error fetching organizations:', error)
                setOrganizations([])
                return
            }

            const userOrgs = (data || []) as UserOrganization[]
            setOrganizations(userOrgs)

            // Find and set current organization
            const currentOrg = userOrgs.find(org => org.is_current)
            if (currentOrg) {
                // Fetch full organization details
                const { data: orgData, error: orgError } = await supabase
                    .from('organizations')
                    .select('*')
                    .eq('organization_id', currentOrg.organization_id)
                    .single()

                if (!orgError && orgData) {
                    setCurrentOrganization(orgData)
                    setCurrentRole(currentOrg.role as OrganizationRole)
                }
            } else if (userOrgs.length > 0) {
                // If no current org set, use the first one
                await switchOrganization(userOrgs[0].organization_id)
            } else {
                setCurrentOrganization(null)
                setCurrentRole(null)
            }
        } catch (error) {
            console.error('Error in refreshOrganizations:', error)
        } finally {
            setIsLoadingOrgs(false)
        }
    }, [user])

    // Switch to a different organization
    const switchOrganization = async (organizationId: string) => {
        if (!user) return

        try {
            // Call the switch_organization function
            const { data, error } = await supabase.rpc('switch_organization', {
                p_organization_id: organizationId
            })

            if (error) {
                console.error('Error switching organization:', error)
                return
            }

            const result = data as { success: boolean; error?: string }
            if (!result.success) {
                console.error('Failed to switch organization:', result.error)
                return
            }

            // Fetch the new organization details
            const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .select('*')
                .eq('organization_id', organizationId)
                .single()

            if (!orgError && orgData) {
                setCurrentOrganization(orgData)

                // Get the role from organizations list
                const userOrg = organizations.find(o => o.organization_id === organizationId)
                if (userOrg) {
                    setCurrentRole(userOrg.role as OrganizationRole)
                }

                // Update the is_current flag in local state
                setOrganizations(prev =>
                    prev.map(org => ({
                        ...org,
                        is_current: org.organization_id === organizationId
                    }))
                )

                // Refresh stats for new organization
                await refreshOrgStats()
            }
        } catch (error) {
            console.error('Error in switchOrganization:', error)
        }
    }

    // Create a new organization
    const createOrganization = async (
        name: string,
        slug: string,
        description?: string
    ): Promise<{ success: boolean; error?: string; organizationId?: string }> => {
        if (!user) {
            return { success: false, error: 'Not authenticated' }
        }

        try {
            const { data, error } = await supabase.rpc('create_organization', {
                p_name: name,
                p_slug: slug,
                p_description: description || null,
                p_contact_email: user.email || null
            })

            if (error) {
                console.error('Error creating organization:', error)
                return { success: false, error: error.message }
            }

            const result = data as { success: boolean; error?: string; organization_id?: string; slug?: string }

            if (result.success) {
                // Refresh organizations list
                await refreshOrganizations()
                return { success: true, organizationId: result.organization_id }
            } else {
                return { success: false, error: result.error || 'Failed to create organization' }
            }
        } catch (error) {
            console.error('Error in createOrganization:', error)
            return { success: false, error: 'An unexpected error occurred' }
        }
    }

    // Fetch organization stats
    const refreshOrgStats = useCallback(async () => {
        if (!currentOrganization) {
            setOrgStats(null)
            return
        }

        try {
            const { data, error } = await supabase.rpc('get_organization_stats', {
                p_organization_id: currentOrganization.organization_id
            })

            if (error) {
                console.error('Error fetching org stats:', error)
                return
            }

            if (data && data.length > 0) {
                setOrgStats(data[0] as OrganizationStats)
            }
        } catch (error) {
            console.error('Error in refreshOrgStats:', error)
        }
    }, [currentOrganization])

    // Load organizations when user changes
    useEffect(() => {
        refreshOrganizations()
    }, [user, refreshOrganizations])

    // Refresh stats when current organization changes
    useEffect(() => {
        if (currentOrganization) {
            refreshOrgStats()
        }
    }, [currentOrganization, refreshOrgStats])

    // Role-based permission helpers
    const isOwner = currentRole === 'owner'
    const isAdmin = currentRole === 'owner' || currentRole === 'admin'
    const isLibrarian = currentRole === 'owner' || currentRole === 'admin' || currentRole === 'librarian'
    const canManageBooks = isLibrarian
    const canManageMembers = isAdmin

    const value: OrganizationContextType = {
        currentOrganization,
        currentRole,
        organizations,
        isLoadingOrgs,
        switchOrganization,
        refreshOrganizations,
        createOrganization,
        orgStats,
        refreshOrgStats,
        isOwner,
        isAdmin,
        isLibrarian,
        canManageBooks,
        canManageMembers
    }

    return (
        <OrganizationContext.Provider value={value}>
            {children}
        </OrganizationContext.Provider>
    )
}

export function useOrganization() {
    const context = useContext(OrganizationContext)
    if (context === undefined) {
        throw new Error('useOrganization must be used within an OrganizationProvider')
    }
    return context
}
