'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { format, isPast } from 'date-fns'
import {
    BookOpen, BookX, Clock, Library, Loader2, AlertTriangle, CheckCircle2, RotateCcw
} from 'lucide-react'
import type { DashboardStats, BorrowedBook } from '@/types/dashboard'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'

const calculateProgress = (borrowed: number, total: number) => {
    return total > 0 ? (borrowed / total) * 100 : 0
}

export default function Dashboard() {
    const { user } = useAuth()
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
        if (!user) {
            console.log('No user found');
            return;
        }
        console.log('Fetching data for user:', user.id);

        setIsLoading(true)
        try {
            // 获取总书籍数
            const { count: totalBooks } = await supabase
                .from('books')
                .select('*', { count: 'exact' });

            // 获取当前借阅数
            const { data: borrowedData, count: borrowedCount } = await supabase
                .from('loans')
                .select('*', { count: 'exact' })
                .eq('user_id', user.id)
                .eq('status', 'borrowed');

            // 获取逾期数
            const { count: overdueCount } = await supabase
                .from('loans')
                .select('*', { count: 'exact' })
                .eq('user_id', user.id)
                .eq('status', 'borrowed')
                .lt('due_date', new Date().toISOString());

            console.log('Stats:', {
                totalBooks,
                borrowedCount,
                overdueCount
            });

            setStats({
                totalbooks: totalBooks || 0,
                borrowedbooks: borrowedCount || 0,
                overduebooks: overdueCount || 0
            });

            // 获取借阅的书籍详情
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
                .eq('user_id', user.id)
                .eq('status', 'borrowed')
                .order('due_date', { ascending: true });

            console.log('Loans data:', loansData);

            if (loansError) {
                throw loansError;
            }

            if (loansData) {
                const formattedBooks = loansData.map(loan => ({
                    id: loan.loan_id,
                    title: loan.books?.title || 'Unknown Title',
                    author: loan.books?.author || 'Unknown Author',
                    due_date: loan.due_date,
                    cover_image: loan.books?.cover_image_url || null
                }));

                console.log('Formatted books:', formattedBooks);

                setBorrowedBooks(formattedBooks);
            }

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
    }, [user, toast]);

    const handleReturnBook = async (loanId: string) => {
        setIsReturning(loanId)
        try {
            const { error } = await supabase.rpc('return_book', {
                p_loan_id: loanId
            })

            if (error) throw error

            toast({
                title: "Success",
                description: "Book returned successfully",
            })
            await fetchDashboardData()
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
        if (!user) {
            router.push('/login')
            return
        }
        fetchDashboardData()
    }, [user, router, fetchDashboardData])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (!user) return null;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <Button variant="outline" onClick={() => fetchDashboardData()}>
                    <RotateCcw className="mr-2 h-4 w-4"/>
                    Refresh
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-linear-to-br from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Books</CardTitle>
                        <Library className="h-4 w-4 text-blue-600 dark:text-blue-400"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalbooks}</div>
                        <p className="text-xs text-muted-foreground">
                            Available in library
                        </p>
                    </CardContent>
                </Card>

                {/* Borrowed Books Card */}
                <Card className="bg-linear-to-br from-green-100 to-green-50 dark:from-green-900 dark:to-green-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Borrowed Books</CardTitle>
                        <BookOpen className="h-4 w-4 text-green-600 dark:text-green-400"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.borrowedbooks}</div>
                        <Progress value={calculateProgress(stats.borrowedbooks, stats.totalbooks)} className="mt-2"/>
                    </CardContent>
                </Card>

                {/* Due Soon Card */}
                <Card className="bg-linear-to-br from-yellow-100 to-yellow-50 dark:from-yellow-900 dark:to-yellow-800">
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
                                return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000 // 3 days
                            }).length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Books due in next 3 days
                        </p>
                    </CardContent>
                </Card>

                {/* Overdue Books Card */}
                <Card className="bg-linear-to-br from-red-100 to-red-50 dark:from-red-900 dark:to-red-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Overdue Books</CardTitle>
                        <BookX className="h-4 w-4 text-red-600 dark:text-red-400"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.overduebooks}</div>
                        <p className="text-xs text-muted-foreground">
                            Please return immediately
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Borrowed Books Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Currently Borrowed Books</CardTitle>
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
