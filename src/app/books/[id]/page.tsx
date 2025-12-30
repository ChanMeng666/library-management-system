'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/AuthContext'
import { Book } from '@/types/book'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    Calendar,
    BookCopy,
    User,
    Building2,
    CalendarDays,
    MapPin,
    Loader2,
    BookOpen,
    Clock,
    AlertTriangle
} from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { format } from 'date-fns'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function BookDetails() {
    const [book, setBook] = useState<Book | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isBorrowing, setIsBorrowing] = useState(false)
    const [isReserving, setIsReserving] = useState(false)
    const params = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const { toast } = useToast()
    const bookId = params.id as string

    const fetchBook = useCallback(async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('books')
                .select(`
                    *,
                    categories(name)
                `)
                .eq('book_id', bookId)
                .single()

            if (error) {
                console.error('Fetch error:', error);
                toast({
                    title: "Error",
                    description: "Failed to fetch book details",
                    variant: "destructive",
                })
                return
            }
            setBook(data)
        } catch (error) {
            console.error('Fetch error:', error);
            toast({
                title: "Error",
                description: "Failed to fetch book details",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }, [bookId, toast])

    useEffect(() => {
        if (bookId) {
            fetchBook()
        }
    }, [bookId, fetchBook])

    const handleBorrow = async () => {
        if (!user) {
            router.push('/login')
            return
        }

        if (!book || book.available_copies <= 0) {
            toast({
                title: "Error",
                description: "This book is not available for borrowing",
                variant: "destructive",
            })
            return
        }

        setIsBorrowing(true)
        try {

            // 首先检查用户是否在users表中存在
            const { data: userData, error: userError } = await supabase
                .from('users')
                // .select('user_id')
                .select('*')
                .eq('user_id', user.id)
                .single()

            if (userError || !userData) {
                toast({
                    title: "Error",
                    description: "User profile not found. Please try logging in again.",
                    variant: "destructive",
                })
                return
            }


            const dueDate = new Date()
            dueDate.setDate(dueDate.getDate() + 14)

            const { data: loanData, error: loanError } = await supabase
                .from('loans')
                .insert([
                    {
                        user_id: user.id,
                        book_id: bookId,
                        due_date: dueDate.toISOString(),
                        checkout_date: new Date().toISOString(),
                        status: 'borrowed'
                    }
                ])
                .select()
                .single()


            if (loanError) {
                console.error('Loan creation error:', loanError)
                toast({
                    title: "Error",
                    description: "Failed to create loan record",
                    variant: "destructive",
                })
                return
            }


            // 更新书籍可用数量
            const { error: updateError } = await supabase
                .from('books')
                .update({
                    available_copies: book.available_copies - 1
                })
                .eq('book_id', bookId)

            if (updateError) {
                // 如果更新失败，回滚借阅记录
                await supabase
                    .from('loans')
                    .delete()
                    .eq('loan_id', loanData.loan_id)

                toast({
                    title: "Error",
                    description: "Failed to update book availability",
                    variant: "destructive",
                })
                return
            }

            toast({
                title: "Success",
                description: "Book borrowed successfully",
            })

            await fetchBook() // 重新获取图书信息以更新可用副本数
        } catch (error) {
            console.error('Borrow error:', error)
            toast({
                title: "Error",
                description: "An unexpected error occurred while borrowing the book",
                variant: "destructive",
            })
        } finally {
            setIsBorrowing(false)
        }
    }

    const handleReserve = async () => {
        if (!user) {
            router.push('/login')
            return
        }

        if (!book) {
            toast({
                title: "Error",
                description: "Book information is not available",
                variant: "destructive",
            })
            return
        }

        setIsReserving(true)
        try {
            // 确保转换为数字类型
            const numericBookId = parseInt(bookId, 10)
            if (isNaN(numericBookId)) {
                throw new Error('Invalid book ID')
            }

            const { error: reserveError } = await supabase.rpc('reserve_book', {
                book_id: numericBookId,
                user_id: user.id
            })

            if (reserveError) {
                console.error('Reserve error:', reserveError)
                let errorMessage = "Failed to reserve the book"
                if (reserveError.message) {
                    errorMessage += `: ${reserveError.message}`
                }
                toast({
                    title: "Error",
                    description: errorMessage,
                    variant: "destructive",
                })
                return
            }

            toast({
                title: "Success",
                description: "Book reserved successfully",
            })

            await fetchBook()
        } catch (error) {
            console.error('Reserve error:', error)
            toast({
                title: "Error",
                description: "An unexpected error occurred while reserving the book",
                variant: "destructive",
            })
        } finally {
            setIsReserving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (!book) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <h2 className="text-2xl font-bold">Book not found</h2>
                <p className="text-muted-foreground mt-2">
                    The book you&apos;re looking for doesn&apos;t exist or has been removed.
                </p>
                <Button onClick={() => router.push('/books')} className="mt-4">
                    Back to Books
                </Button>
            </div>
        )
    }

    return (
        <div className="container max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Book Cover and Actions */}
                <Card className="lg:col-span-1">
                    <CardContent className="p-6">
                        <div className="relative aspect-2/3 w-full rounded-lg overflow-hidden mb-6">
                            <Image
                                src={book.cover_image_url || '/images/placeholder.jpg'}
                                alt={book.title}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                        <div className="space-y-4">
                            <Badge
                                variant={book.available_copies > 0 ? 'default' : 'secondary'}
                                className="w-full justify-center py-1.5"
                            >
                                {book.available_copies > 0
                                    ? `${book.available_copies} Copies Available`
                                    : 'Currently Unavailable'
                                }
                            </Badge>
                            <Button
                                className="w-full"
                                onClick={handleBorrow}
                                disabled={book.available_copies === 0 || isBorrowing}
                            >
                                {isBorrowing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Borrowing...
                                    </>
                                ) : (
                                    <>
                                        <BookOpen className="mr-2 h-4 w-4" />
                                        Borrow Book
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleReserve}
                                disabled={book.available_copies > 0 || isReserving}
                            >
                                {isReserving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Reserving...
                                    </>
                                ) : (
                                    <>
                                        <Clock className="mr-2 h-4 w-4" />
                                        Reserve Book
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Book Details */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-3xl">{book.title}</CardTitle>
                        <CardDescription className="text-lg">
                            by {book.author}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Book Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <BookCopy className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">ISBN:</span>
                                    <span>{book.isbn}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Publisher:</span>
                                    <span>{book.publisher}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Published:</span>
                                    <span>
                                        {book.publish_date && format(new Date(book.publish_date), 'MMMM d, yyyy')}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Category:</span>
                                    <span>{book.categories?.name}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Location:</span>
                                    <span>{book.location || 'Not specified'}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Loan Period:</span>
                                    <span>14 days</span>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Book Description */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">About this book</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {book.description || 'No description available.'}
                            </p>
                        </div>

                        <Separator />

                        {/* Borrowing Rules */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Borrowing Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <Card className="p-4 bg-muted">
                                    <h4 className="font-medium mb-2">Loan Period</h4>
                                    <p className="text-muted-foreground">
                                        Books can be borrowed for 14 days. Please return the book on time
                                        to avoid any late fees.
                                    </p>
                                </Card>
                                <Card className="p-4 bg-muted">
                                    <h4 className="font-medium mb-2">Reservations</h4>
                                    <p className="text-muted-foreground">
                                        If the book isn&apos;t available, you can place a reservation
                                        and we&apos;ll notify you when it&apos;s ready.
                                    </p>
                                </Card>
                            </div>
                        </div>

                        {book.available_copies === 0 && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Currently Unavailable</AlertTitle>
                                <AlertDescription>
                                    This book is currently borrowed. You can place a reservation to be
                                    notified when it becomes available.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
