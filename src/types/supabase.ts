export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            books: {
                Row: {
                    author: string
                    available_copies: number
                    book_id: string
                    category_id: number | null
                    cover_image_url: string | null
                    created_at: string | null
                    description: string | null
                    isbn: string
                    location: string | null
                    organization_id: string
                    publish_date: string | null
                    publisher: string | null
                    title: string
                    total_copies: number
                    updated_at: string | null
                }
                Insert: {
                    author: string
                    available_copies?: number
                    book_id?: string
                    category_id?: number | null
                    cover_image_url?: string | null
                    created_at?: string | null
                    description?: string | null
                    isbn: string
                    location?: string | null
                    organization_id: string
                    publish_date?: string | null
                    publisher?: string | null
                    title: string
                    total_copies?: number
                    updated_at?: string | null
                }
                Update: {
                    author?: string
                    available_copies?: number
                    book_id?: string
                    category_id?: number | null
                    cover_image_url?: string | null
                    created_at?: string | null
                    description?: string | null
                    isbn?: string
                    location?: string | null
                    organization_id?: string
                    publish_date?: string | null
                    publisher?: string | null
                    title?: string
                    total_copies?: number
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "books_category_id_fkey"
                        columns: ["category_id"]
                        isOneToOne: false
                        referencedRelation: "categories"
                        referencedColumns: ["category_id"]
                    },
                    {
                        foreignKeyName: "books_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["organization_id"]
                    },
                ]
            }
            categories: {
                Row: {
                    category_id: number
                    created_at: string | null
                    description: string | null
                    name: string
                    organization_id: string | null
                }
                Insert: {
                    category_id?: number
                    created_at?: string | null
                    description?: string | null
                    name: string
                    organization_id?: string | null
                }
                Update: {
                    category_id?: number
                    created_at?: string | null
                    description?: string | null
                    name?: string
                    organization_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "categories_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["organization_id"]
                    },
                ]
            }
            loans: {
                Row: {
                    book_id: string | null
                    checkout_date: string | null
                    created_at: string | null
                    due_date: string
                    fine_amount: number | null
                    loan_id: string
                    organization_id: string
                    return_date: string | null
                    status: string | null
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    book_id?: string | null
                    checkout_date?: string | null
                    created_at?: string | null
                    due_date: string
                    fine_amount?: number | null
                    loan_id?: string
                    organization_id: string
                    return_date?: string | null
                    status?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    book_id?: string | null
                    checkout_date?: string | null
                    created_at?: string | null
                    due_date?: string
                    fine_amount?: number | null
                    loan_id?: string
                    organization_id?: string
                    return_date?: string | null
                    status?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "loans_book_id_fkey"
                        columns: ["book_id"]
                        isOneToOne: false
                        referencedRelation: "books"
                        referencedColumns: ["book_id"]
                    },
                    {
                        foreignKeyName: "loans_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["organization_id"]
                    },
                    {
                        foreignKeyName: "loans_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["user_id"]
                    },
                ]
            }
            organization_invitations: {
                Row: {
                    accepted_at: string | null
                    created_at: string | null
                    email: string
                    expires_at: string
                    invitation_id: string
                    invited_by: string
                    message: string | null
                    organization_id: string
                    role: string
                    status: string | null
                    token: string
                }
                Insert: {
                    accepted_at?: string | null
                    created_at?: string | null
                    email: string
                    expires_at?: string
                    invitation_id?: string
                    invited_by: string
                    message?: string | null
                    organization_id: string
                    role?: string
                    status?: string | null
                    token: string
                }
                Update: {
                    accepted_at?: string | null
                    created_at?: string | null
                    email?: string
                    expires_at?: string
                    invitation_id?: string
                    invited_by?: string
                    message?: string | null
                    organization_id?: string
                    role?: string
                    status?: string | null
                    token?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "organization_invitations_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["organization_id"]
                    },
                ]
            }
            organization_members: {
                Row: {
                    created_at: string | null
                    invited_by: string | null
                    joined_at: string | null
                    membership_id: string
                    organization_id: string
                    role: string
                    status: string | null
                    suspended_at: string | null
                    suspended_reason: string | null
                    updated_at: string | null
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    invited_by?: string | null
                    joined_at?: string | null
                    membership_id?: string
                    organization_id: string
                    role?: string
                    status?: string | null
                    suspended_at?: string | null
                    suspended_reason?: string | null
                    updated_at?: string | null
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    invited_by?: string | null
                    joined_at?: string | null
                    membership_id?: string
                    organization_id?: string
                    role?: string
                    status?: string | null
                    suspended_at?: string | null
                    suspended_reason?: string | null
                    updated_at?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "organization_members_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["organization_id"]
                    },
                ]
            }
            organizations: {
                Row: {
                    address: string | null
                    cancel_at_period_end: boolean | null
                    contact_email: string | null
                    contact_phone: string | null
                    created_at: string | null
                    current_period_end: string | null
                    description: string | null
                    loan_duration_days: number | null
                    logo_url: string | null
                    max_books: number | null
                    max_loans_per_user: number | null
                    max_users: number | null
                    name: string
                    organization_id: string
                    settings: Json | null
                    slug: string
                    stripe_customer_id: string | null
                    stripe_price_id: string | null
                    stripe_subscription_id: string | null
                    subscription_ends_at: string | null
                    subscription_plan: string | null
                    subscription_status: string | null
                    trial_ends_at: string | null
                    updated_at: string | null
                    website: string | null
                }
                Insert: {
                    address?: string | null
                    cancel_at_period_end?: boolean | null
                    contact_email?: string | null
                    contact_phone?: string | null
                    created_at?: string | null
                    current_period_end?: string | null
                    description?: string | null
                    loan_duration_days?: number | null
                    logo_url?: string | null
                    max_books?: number | null
                    max_loans_per_user?: number | null
                    max_users?: number | null
                    name: string
                    organization_id?: string
                    settings?: Json | null
                    slug: string
                    stripe_customer_id?: string | null
                    stripe_price_id?: string | null
                    stripe_subscription_id?: string | null
                    subscription_ends_at?: string | null
                    subscription_plan?: string | null
                    subscription_status?: string | null
                    trial_ends_at?: string | null
                    updated_at?: string | null
                    website?: string | null
                }
                Update: {
                    address?: string | null
                    cancel_at_period_end?: boolean | null
                    contact_email?: string | null
                    contact_phone?: string | null
                    created_at?: string | null
                    current_period_end?: string | null
                    description?: string | null
                    loan_duration_days?: number | null
                    logo_url?: string | null
                    max_books?: number | null
                    max_loans_per_user?: number | null
                    max_users?: number | null
                    name?: string
                    organization_id?: string
                    settings?: Json | null
                    slug?: string
                    stripe_customer_id?: string | null
                    stripe_price_id?: string | null
                    stripe_subscription_id?: string | null
                    subscription_ends_at?: string | null
                    subscription_plan?: string | null
                    subscription_status?: string | null
                    trial_ends_at?: string | null
                    updated_at?: string | null
                    website?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "organizations_subscription_plan_fkey"
                        columns: ["subscription_plan"]
                        isOneToOne: false
                        referencedRelation: "subscription_plans"
                        referencedColumns: ["plan_id"]
                    },
                ]
            }
            reservations: {
                Row: {
                    book_id: string | null
                    created_at: string | null
                    organization_id: string
                    reservation_date: string | null
                    reservation_id: string
                    status: string | null
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    book_id?: string | null
                    created_at?: string | null
                    organization_id: string
                    reservation_date?: string | null
                    reservation_id?: string
                    status?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    book_id?: string | null
                    created_at?: string | null
                    organization_id?: string
                    reservation_date?: string | null
                    reservation_id?: string
                    status?: string | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "reservations_book_id_fkey"
                        columns: ["book_id"]
                        isOneToOne: false
                        referencedRelation: "books"
                        referencedColumns: ["book_id"]
                    },
                    {
                        foreignKeyName: "reservations_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["organization_id"]
                    },
                    {
                        foreignKeyName: "reservations_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["user_id"]
                    },
                ]
            }
            reviews: {
                Row: {
                    book_id: string | null
                    comment: string | null
                    created_at: string | null
                    organization_id: string
                    rating: number | null
                    review_id: string
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    book_id?: string | null
                    comment?: string | null
                    created_at?: string | null
                    organization_id: string
                    rating?: number | null
                    review_id?: string
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    book_id?: string | null
                    comment?: string | null
                    created_at?: string | null
                    organization_id?: string
                    rating?: number | null
                    review_id?: string
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "reviews_book_id_fkey"
                        columns: ["book_id"]
                        isOneToOne: false
                        referencedRelation: "books"
                        referencedColumns: ["book_id"]
                    },
                    {
                        foreignKeyName: "reviews_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["organization_id"]
                    },
                    {
                        foreignKeyName: "reviews_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["user_id"]
                    },
                ]
            }
            subscription_history: {
                Row: {
                    amount: number | null
                    change_reason: string | null
                    changed_by: string | null
                    created_at: string | null
                    currency: string | null
                    history_id: string
                    new_plan: string | null
                    new_status: string | null
                    organization_id: string
                    previous_plan: string | null
                    previous_status: string | null
                    stripe_event_id: string | null
                    stripe_invoice_id: string | null
                }
                Insert: {
                    amount?: number | null
                    change_reason?: string | null
                    changed_by?: string | null
                    created_at?: string | null
                    currency?: string | null
                    history_id?: string
                    new_plan?: string | null
                    new_status?: string | null
                    organization_id: string
                    previous_plan?: string | null
                    previous_status?: string | null
                    stripe_event_id?: string | null
                    stripe_invoice_id?: string | null
                }
                Update: {
                    amount?: number | null
                    change_reason?: string | null
                    changed_by?: string | null
                    created_at?: string | null
                    currency?: string | null
                    history_id?: string
                    new_plan?: string | null
                    new_status?: string | null
                    organization_id?: string
                    previous_plan?: string | null
                    previous_status?: string | null
                    stripe_event_id?: string | null
                    stripe_invoice_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "subscription_history_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["organization_id"]
                    },
                ]
            }
            subscription_plans: {
                Row: {
                    created_at: string | null
                    description: string | null
                    features: Json | null
                    is_active: boolean | null
                    max_books: number | null
                    max_loans_per_user: number | null
                    max_users: number | null
                    name: string
                    plan_id: string
                    price_monthly: number | null
                    price_yearly: number | null
                    sort_order: number | null
                    stripe_price_id_monthly: string | null
                    stripe_price_id_yearly: string | null
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    description?: string | null
                    features?: Json | null
                    is_active?: boolean | null
                    max_books?: number | null
                    max_loans_per_user?: number | null
                    max_users?: number | null
                    name: string
                    plan_id: string
                    price_monthly?: number | null
                    price_yearly?: number | null
                    sort_order?: number | null
                    stripe_price_id_monthly?: string | null
                    stripe_price_id_yearly?: string | null
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    description?: string | null
                    features?: Json | null
                    is_active?: boolean | null
                    max_books?: number | null
                    max_loans_per_user?: number | null
                    max_users?: number | null
                    name?: string
                    plan_id?: string
                    price_monthly?: number | null
                    price_yearly?: number | null
                    sort_order?: number | null
                    stripe_price_id_monthly?: string | null
                    stripe_price_id_yearly?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            users: {
                Row: {
                    address: string | null
                    avatar_url: string | null
                    created_at: string | null
                    current_organization_id: string | null
                    email: string
                    full_name: string
                    membership_type: string | null
                    phone: string | null
                    preferences: Json | null
                    updated_at: string | null
                    user_id: string
                    username: string
                }
                Insert: {
                    address?: string | null
                    avatar_url?: string | null
                    created_at?: string | null
                    current_organization_id?: string | null
                    email: string
                    full_name: string
                    membership_type?: string | null
                    phone?: string | null
                    preferences?: Json | null
                    updated_at?: string | null
                    user_id?: string
                    username: string
                }
                Update: {
                    address?: string | null
                    avatar_url?: string | null
                    created_at?: string | null
                    current_organization_id?: string | null
                    email?: string
                    full_name?: string
                    membership_type?: string | null
                    phone?: string | null
                    preferences?: Json | null
                    updated_at?: string | null
                    user_id?: string
                    username?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "users_current_organization_id_fkey"
                        columns: ["current_organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["organization_id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            accept_invitation: {
                Args: {
                    p_token: string
                }
                Returns: Json
            }
            borrow_book: {
                Args: {
                    p_organization_id: string
                    p_book_id: string
                    p_user_id?: string
                    p_due_date?: string
                }
                Returns: Json
            }
            check_org_book_quota: {
                Args: {
                    org_id: string
                }
                Returns: boolean
            }
            check_org_user_quota: {
                Args: {
                    org_id: string
                }
                Returns: boolean
            }
            create_organization: {
                Args: {
                    p_name: string
                    p_slug: string
                    p_description?: string
                    p_contact_email?: string
                }
                Returns: Json
            }
            generate_invitation_token: {
                Args: Record<PropertyKey, never>
                Returns: string
            }
            get_activity_data: {
                Args: {
                    p_organization_id: string
                    p_time_range?: string
                }
                Returns: {
                    name: string
                    loans: number
                    returns: number
                    new_members: number
                }[]
            }
            get_category_distribution: {
                Args: {
                    p_organization_id: string
                }
                Returns: {
                    name: string
                    value: number
                }[]
            }
            get_loan_trends: {
                Args: {
                    p_organization_id: string
                    p_days?: number
                }
                Returns: {
                    date: string
                    loans: number
                }[]
            }
            get_org_loan_duration: {
                Args: {
                    org_id: string
                }
                Returns: number
            }
            get_org_max_loans_per_user: {
                Args: {
                    org_id: string
                }
                Returns: number
            }
            get_org_role: {
                Args: {
                    org_id: string
                }
                Returns: string
            }
            get_organization_stats: {
                Args: {
                    p_organization_id: string
                }
                Returns: {
                    total_books: number
                    total_members: number
                    active_loans: number
                    overdue_loans: number
                    total_reservations: number
                    books_quota: number
                    users_quota: number
                }[]
            }
            get_popular_books: {
                Args: {
                    p_organization_id: string
                    p_limit?: number
                }
                Returns: {
                    title: string
                    loan_count: number
                }[]
            }
            get_user_active_loans_count: {
                Args: {
                    org_id: string
                    p_user_id: string
                }
                Returns: number
            }
            get_user_dashboard_stats: {
                Args: {
                    p_organization_id: string
                    p_user_id?: string
                }
                Returns: {
                    total_books: number
                    borrowed_books: number
                    overdue_books: number
                    reservations: number
                }[]
            }
            get_user_org_ids: {
                Args: Record<PropertyKey, never>
                Returns: string[]
            }
            get_user_organizations: {
                Args: Record<PropertyKey, never>
                Returns: {
                    organization_id: string
                    name: string
                    slug: string
                    logo_url: string
                    role: string
                    subscription_plan: string
                    subscription_status: string
                    is_current: boolean
                }[]
            }
            invite_to_organization: {
                Args: {
                    p_organization_id: string
                    p_email: string
                    p_role?: string
                    p_message?: string
                }
                Returns: Json
            }
            is_org_admin: {
                Args: {
                    org_id: string
                }
                Returns: boolean
            }
            is_org_librarian: {
                Args: {
                    org_id: string
                }
                Returns: boolean
            }
            is_org_member: {
                Args: {
                    org_id: string
                }
                Returns: boolean
            }
            is_org_subscription_active: {
                Args: {
                    org_id: string
                }
                Returns: boolean
            }
            reserve_book: {
                Args: {
                    p_organization_id: string
                    p_book_id: string
                    p_user_id?: string
                }
                Returns: Json
            }
            return_book: {
                Args: {
                    p_loan_id: string
                    p_organization_id?: string
                }
                Returns: Json
            }
            switch_organization: {
                Args: {
                    p_organization_id: string
                }
                Returns: Json
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
    PublicTableNameOrOptions extends
            | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
        | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
        ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
            Database[PublicTableNameOrOptions["schema"]]["Views"])
        : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
        ? R
        : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
            PublicSchema["Views"])
        ? (PublicSchema["Tables"] &
            PublicSchema["Views"])[PublicTableNameOrOptions] extends {
                Row: infer R
            }
            ? R
            : never
        : never

export type TablesInsert<
    PublicTableNameOrOptions extends
            | keyof PublicSchema["Tables"]
        | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
        ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
        : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
            Insert: infer I
        }
        ? I
        : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
        ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
                Insert: infer I
            }
            ? I
            : never
        : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
            | keyof PublicSchema["Tables"]
        | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
        ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
        : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
            Update: infer U
        }
        ? U
        : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
        ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
                Update: infer U
            }
            ? U
            : never
        : never

export type Enums<
    PublicEnumNameOrOptions extends
            | keyof PublicSchema["Enums"]
        | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
        ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
        : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
        ? PublicSchema["Enums"][PublicEnumNameOrOptions]
        : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
            | keyof PublicSchema["CompositeTypes"]
        | { schema: keyof Database },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
            schema: keyof Database
        }
        ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
        : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
    ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
        ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
        : never

// =====================================================
// Custom Type Definitions for Multi-Tenant System
// =====================================================

export type Organization = Tables<'organizations'>
export type OrganizationInsert = TablesInsert<'organizations'>
export type OrganizationUpdate = TablesUpdate<'organizations'>

export type OrganizationMember = Tables<'organization_members'>
export type OrganizationMemberInsert = TablesInsert<'organization_members'>

export type OrganizationInvitation = Tables<'organization_invitations'>

export type SubscriptionPlan = Tables<'subscription_plans'>

export type SubscriptionHistory = Tables<'subscription_history'>

// Role types
export type OrganizationRole = 'owner' | 'admin' | 'librarian' | 'member'

export type SubscriptionPlanId = 'free' | 'basic' | 'pro' | 'enterprise'

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled'

export type MemberStatus = 'pending' | 'active' | 'suspended'

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled'

// Organization settings type
export interface OrganizationSettings {
    allowSelfRegistration?: boolean
    requireApproval?: boolean
    overdueFinePer Day?: number
    theme?: {
        primaryColor?: string
    }
    features?: Record<string, boolean>
}

// Plan features type
export interface PlanFeatures {
    reservations?: boolean
    reviews?: boolean
    reports?: boolean
    customBranding?: boolean
    apiAccess?: boolean
    prioritySupport?: boolean
    sso?: boolean
}

// User organization info (from get_user_organizations function)
export interface UserOrganization {
    organization_id: string
    name: string
    slug: string
    logo_url: string | null
    role: OrganizationRole
    subscription_plan: SubscriptionPlanId
    subscription_status: SubscriptionStatus
    is_current: boolean
}

// Organization stats (from get_organization_stats function)
export interface OrganizationStats {
    total_books: number
    total_members: number
    active_loans: number
    overdue_loans: number
    total_reservations: number
    books_quota: number | null
    users_quota: number | null
}

// Dashboard stats (from get_user_dashboard_stats function)
export interface UserDashboardStats {
    total_books: number
    borrowed_books: number
    overdue_books: number
    reservations: number
}
