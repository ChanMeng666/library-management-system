'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/contexts/OrganizationContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Badge } from '@/components/ui/badge'
import { format, isPast } from 'date-fns'
import {
    BookOpen, BookX, Clock, Library, Loader2, AlertTriangle, CheckCircle2, RotateCcw,
    Users, Building2, Settings
} from 'lucide-react'
import type { DashboardStats, BorrowedBook } from '@/types/dashboard'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Loading } from '@/components/ui/loading'
import Link from 'next/link'

const calculateProgress = (borrowed: number, total: number) => {
    return total > 0 ? (borrowed / total) * 100 : 0
}

export default function Dashboard() {
    const { user, loading: authLoading } = useAuth()
    const {
        currentOrganization,
        isLoadingOrgs,
        orgStats,
        refreshOrgStats,
        isAdmin,
        currentRole
    } = useOrganization()
    const router = useRouter()
    const [stats, setStats] = useState<DashboardStats>({
        totalbooks: 0,
        borrowedbooks: 0,
        overduebooks: 0
    })
    const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isReturning, setIsReturning] = useState<string | null>(null)
    const { toast } = useToast()

    const fetchDashboardData = useCallback(async () => {
        if (!user || !currentOrganization) {
            return;
        }

        setIsLoading(true)
        try {
            // Get user dashboard stats using the stored function
            const { data: statsData, error: statsError } = await supabase.rpc(
                'get_user_dashboard_stats',
                {
                    p_organization_id: currentOrganization.organization_id,
                    p_user_id: user.id
                }
            )

            if (statsError) {
                console.error('Error fetching stats:', statsError)
            } else if (statsData && statsData.length > 0) {
                setStats({
                    totalbooks: statsData[0].total_books || 0,
                    borrowedbooks: statsData[0].borrowed_books || 0,
                    overduebooks: statsData[0].overdue_books || 0
                })
            }

            // Get borrowed books details
            const { data: loansData, error: loansError } = await supabase
                .from('loans')
                .select(`
                    loan_id,
                    due_date,
                    books (
                        book_id,
                        title,
                        author,
                        cover_image_url
                    )
                `)
                .eq('organization_id', currentOrganization.organization_id)
                .eq('user_id', user.id)
                .eq('status', 'active')
                .order('due_date', { ascending: true });

            if (loansError) {
                throw loansError;
            }

            if (loansData) {
                const formattedBooks = loansData.map(loan => ({
                    id: loan.loan_id,
                    title: (loan.books as { title?: string })?.title || 'Unknown Title',
                    author: (loan.books as { author?: string })?.author || 'Unknown Author',
                    due_date: loan.due_date,
                    cover_image: (loan.books as { cover_image_url?: string })?.cover_image_url || null
                }));

                setBorrowedBooks(formattedBooks);
            }

            // Refresh org stats for admin cards
            await refreshOrgStats()

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast({
                title: "Error",
                description: "Failed to fetch dashboard data",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [user, currentOrganization, toast, refreshOrgStats]);

    const handleReturnBook = async (loanId: string) => {
        if (!currentOrganization) return

        setIsReturning(loanId)
        try {
            const { data, error } = await supabase.rpc('return_book', {
                p_loan_id: loanId,
                p_organization_id: currentOrganization.organization_id
            })

            if (error) throw error

            const result = data as { success: boolean; error?: string; fine_amount?: number }

            if (result.success) {
                toast({
                    title: "Success",
                    description: result.fine_amount && result.fine_amount > 0
                        ? `Book returned. Fine: $${result.fine_amount.toFixed(2)}`
                        : "Book returned successfully",
                })
                await fetchDashboardData()
            } else {
                throw new Error(result.error || 'Failed to return book')
            }
        } catch (error) {
            console.error('Error returning book:', error)
            toast({
                title: "Error",
                description: "Failed to return the book",
                variant: "destructive",
            })
        } finally {
            setIsReturning(null)
        }
    }

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
            return
        }
    }, [user, authLoading, router])

    useEffect(() => {
        if (!isLoadingOrgs && user && !currentOrganization) {
            router.push('/org/select')
            return
        }
    }, [user, isLoadingOrgs, currentOrganization, router])

    useEffect(() => {
        if (user && currentOrganization) {
            fetchDashboardData()
        }
    }, [user, currentOrganization, fetchDashboardData])

    if (authLoading || isLoadingOrgs || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loading size="lg" />
            </div>
        )
    }

    if (!user || !currentOrganization) return null;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <div className="text-muted-foreground flex items-center gap-2 mt-1">
                        <Building2 className="h-4 w-4" />
                        {currentOrganization.name}
                        <Badge variant="outline">{currentRole}</Badge>
                        <Badge
                            variant={
                                currentOrganization.subscription_plan === 'enterprise' ? 'default' :
                                currentOrganization.subscription_plan === 'pro' ? 'secondary' :
                                currentOrganization.subscription_plan === 'basic' ? 'outline' :
                                'outline'
                            }
                            className="capitalize"
                        >
                            {currentOrganization.subscription_plan || 'free'}
                        </Badge>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isAdmin && (
                        <Button variant="outline" onClick={() => router.push('/org/settings')}>
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => fetchDashboardData()}>
                        <RotateCcw className="mr-2 h-4 w-4"/>
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Organization Overview (Admin Only) */}
            {isAdmin && orgStats && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900 dark:to-purple-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Books</CardTitle>
                            <Library className="h-4 w-4 text-purple-600 dark:text-purple-400"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{orgStats.total_books}</div>
                            <p className="text-xs text-muted-foreground">
                                {orgStats.books_quota ? `of ${orgStats.books_quota} quota` : 'Unlimited'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900 dark:to-indigo-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Members</CardTitle>
                            <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{orgStats.total_members}</div>
                            <p className="text-xs text-muted-foreground">
                                {orgStats.users_quota ? `of ${orgStats.users_quota} quota` : 'Unlimited'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900 dark:to-green-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
                            <BookOpen className="h-4 w-4 text-green-600 dark:text-green-400"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{orgStats.active_loans}</div>
                            <p className="text-xs text-muted-foreground">
                                Across all members
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900 dark:to-red-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                            <BookX className="h-4 w-4 text-red-600 dark:text-red-400"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{orgStats.overdue_loans}</div>
                            <p className="text-xs text-muted-foreground">
                                Need attention
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* User Stats */}
            <div>
                <h3 className="text-lg font-semibold mb-4">My Library Activity</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Library Catalog</CardTitle>
                            <Library className="h-4 w-4 text-blue-600 dark:text-blue-400"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalbooks}</div>
                            <p className="text-xs text-muted-foreground">
                                Books available
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900 dark:to-green-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">My Borrowed</CardTitle>
                            <BookOpen className="h-4 w-4 text-green-600 dark:text-green-400"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.borrowedbooks}</div>
                            <Progress value={calculateProgress(stats.borrowedbooks, currentOrganization.max_loans_per_user || 5)} className="mt-2"/>
                            <p className="text-xs text-muted-foreground mt-1">
                                of {currentOrganization.max_loans_per_user || 5} max loans
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-yellow-100 to-yellow-50 dark:from-yellow-900 dark:to-yellow-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {borrowedBooks.filter(book => {
                                    const dueDate = new Date(book.due_date)
                                    const today = new Date()
                                    const diff = dueDate.getTime() - today.getTime()
                                    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000
                                }).length}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Due in next 3 days
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900 dark:to-red-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                            <BookX className="h-4 w-4 text-red-600 dark:text-red-400"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.overduebooks}</div>
                            <p className="text-xs text-muted-foreground">
                                Return immediately
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Borrowed Books Section */}
            <Card>
                <CardHeader>
                    <CardTitle>My Borrowed Books</CardTitle>
                    <CardDescription>
                        Manage your borrowed books and their due dates
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {borrowedBooks.length === 0 ? (
                        <div className="text-center py-6">
                            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground"/>
                            <h3 className="mt-2 text-lg font-semibold">No books borrowed</h3>
                            <p className="text-sm text-muted-foreground">
                                Visit our catalog to discover and borrow books
                            </p>
                            <Button className="mt-4" asChild>
                                <Link href="/books">Browse Books</Link>
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Book</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {borrowedBooks.map((book) => {
                                    const isOverdue = isPast(new Date(book.due_date))
                                    const isDueSoon = !isOverdue &&
                                        new Date(book.due_date).getTime() - new Date().getTime() < 3 * 24 * 60 * 60 * 1000

                                    return (
                                        <TableRow key={book.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center space-x-3">
                                                    <div className="font-medium">{book.title}</div>
                                                    <span className="text-muted-foreground">
                                                        by {book.author}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(book.due_date), 'MMM dd, yyyy')}
                                            </TableCell>
                                            <TableCell>
                                                {isOverdue ? (
                                                    <div className="flex items-center">
                                                        <AlertTriangle className="h-4 w-4 text-destructive mr-2"/>
                                                        <span className="text-destructive">Overdue</span>
                                                    </div>
                                                ) : isDueSoon ? (
                                                    <div className="flex items-center">
                                                        <Clock className="h-4 w-4 text-yellow-500 mr-2"/>
                                                        <span className="text-yellow-500">Due Soon</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center">
                                                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2"/>
                                                        <span className="text-green-500">On Time</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleReturnBook(book.id)}
                                                    disabled={isReturning === book.id}
                                                >
                                                    {isReturning === book.id ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                                            Returning...
                                                        </>
                                                    ) : (
                                                        'Return Book'
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {stats.overduebooks > 0 && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4"/>
                    <AlertTitle>Overdue Books Notice</AlertTitle>
                    <AlertDescription>
                        You have {stats.overduebooks} overdue {stats.overduebooks === 1 ? 'book' : 'books'}.
                        Please return them as soon as possible to avoid additional fees.
                    </AlertDescription>
                </Alert>
            )}
            <Toaster/>
        </div>
    )
}
