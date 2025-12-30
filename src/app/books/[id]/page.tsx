'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/contexts/OrganizationContext'
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
    AlertTriangle,
    ArrowLeft,
    Pencil,
    Trash2
} from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { format } from 'date-fns'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loading } from '@/components/ui/loading'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import Link from 'next/link'

export default function BookDetails() {
    const [book, setBook] = useState<Book | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isBorrowing, setIsBorrowing] = useState(false)
    const [isReserving, setIsReserving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const params = useParams()
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const { currentOrganization, isLoadingOrgs, canManageBooks } = useOrganization()
    const { toast } = useToast()
    const bookId = params.id as string

    const fetchBook = useCallback(async () => {
        if (!currentOrganization) return

        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('books')
                .select(`
                    *,
                    categories(name)
                `)
                .eq('book_id', bookId)
                .eq('organization_id', currentOrganization.organization_id)
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
    }, [bookId, currentOrganization, toast])

    useEffect(() => {
        if (!authLoading && !isLoadingOrgs && user && !currentOrganization) {
            router.push('/org/select')
        }
    }, [user, authLoading, isLoadingOrgs, currentOrganization, router])

    useEffect(() => {
        if (bookId && currentOrganization) {
            fetchBook()
        }
    }, [bookId, currentOrganization, fetchBook])

    const handleBorrow = async () => {
        if (!user) {
            router.push('/login')
            return
        }

        if (!currentOrganization) {
            router.push('/org/select')
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
            const { data, error } = await supabase.rpc('borrow_book', {
                p_organization_id: currentOrganization.organization_id,
                p_book_id: bookId,
                p_user_id: user.id
            })

            if (error) {
                console.error('Borrow error:', error)
                toast({
                    title: "Error",
                    description: "Failed to borrow the book",
                    variant: "destructive",
                })
                return
            }

            const result = data as { success: boolean; error?: string; due_date?: string }

            if (result.success) {
                toast({
                    title: "Success",
                    description: `Book borrowed successfully. Due: ${result.due_date ? format(new Date(result.due_date), 'MMM dd, yyyy') : 'in ' + (currentOrganization.loan_duration_days || 14) + ' days'}`,
                })
                await fetchBook()
            } else {
                let errorMessage = "Failed to borrow the book"
                switch (result.error) {
                    case 'not_member':
                        errorMessage = "You are not a member of this organization"
                        break
                    case 'subscription_inactive':
                        errorMessage = "Organization subscription is inactive"
                        break
                    case 'max_loans_reached':
                        errorMessage = "You have reached the maximum number of active loans"
                        break
                    case 'book_not_found':
                        errorMessage = "Book not found"
                        break
                    case 'no_copies_available':
                        errorMessage = "No copies available"
                        break
                    default:
                        errorMessage = result.error || errorMessage
                }
                toast({
                    title: "Error",
                    description: errorMessage,
                    variant: "destructive",
                })
            }
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

        if (!currentOrganization) {
            router.push('/org/select')
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
            const { data, error } = await supabase.rpc('reserve_book', {
                p_organization_id: currentOrganization.organization_id,
                p_book_id: bookId,
                p_user_id: user.id
            })

            if (error) {
                console.error('Reserve error:', error)
                toast({
                    title: "Error",
                    description: "Failed to reserve the book",
                    variant: "destructive",
                })
                return
            }

            const result = data as { success: boolean; error?: string }

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Book reserved successfully. We'll notify you when it's available.",
                })
                await fetchBook()
            } else {
                let errorMessage = "Failed to reserve the book"
                switch (result.error) {
                    case 'not_member':
                        errorMessage = "You are not a member of this organization"
                        break
                    case 'subscription_inactive':
                        errorMessage = "Organization subscription is inactive"
                        break
                    case 'copies_available':
                        errorMessage = "Copies are available. You can borrow instead of reserving."
                        break
                    case 'already_reserved':
                        errorMessage = "You already have a pending reservation for this book"
                        break
                    default:
                        errorMessage = result.error || errorMessage
                }
                toast({
                    title: "Error",
                    description: errorMessage,
                    variant: "destructive",
                })
            }
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

    const handleDelete = async () => {
        if (!currentOrganization || !book) return

        setIsDeleting(true)
        try {
            // Check if there are active loans for this book
            const { data: activeLoans } = await supabase
                .from('loans')
                .select('loan_id')
                .eq('book_id', bookId)
                .eq('organization_id', currentOrganization.organization_id)
                .is('return_date', null)
                .limit(1)

            if (activeLoans && activeLoans.length > 0) {
                toast({
                    title: "Cannot Delete",
                    description: "This book has active loans. Please wait for all copies to be returned.",
                    variant: "destructive",
                })
                return
            }

            const { error } = await supabase
                .from('books')
                .delete()
                .eq('book_id', bookId)
                .eq('organization_id', currentOrganization.organization_id)

            if (error) throw error

            toast({
                title: "Success",
                description: "Book deleted successfully",
            })

            router.push('/books')
        } catch (error) {
            console.error('Delete error:', error)
            toast({
                title: "Error",
                description: "Failed to delete the book",
                variant: "destructive",
            })
        } finally {
            setIsDeleting(false)
        }
    }

    if (authLoading || isLoadingOrgs) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loading size="lg" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="text-center py-12">
                <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Sign in to view books</h2>
                <p className="text-muted-foreground mb-6">
                    Please sign in to access the book catalog.
                </p>
                <div className="flex justify-center gap-4">
                    <Button variant="outline" asChild>
                        <Link href="/login">Sign In</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/register">Get Started</Link>
                    </Button>
                </div>
            </div>
        )
    }

    if (!currentOrganization) {
        return (
            <div className="text-center py-12">
                <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">No Organization Selected</h2>
                <p className="text-muted-foreground mb-6">
                    Please select an organization to view books.
                </p>
                <Button asChild>
                    <Link href="/org/select">Select Organization</Link>
                </Button>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loading size="lg" />
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

    const loanDuration = currentOrganization.loan_duration_days || 14

    return (
        <div className="container max-w-7xl mx-auto px-4">
            <Button
                variant="ghost"
                onClick={() => router.push('/books')}
                className="mb-6"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Catalog
            </Button>

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

                            {/* Admin/Librarian Actions */}
                            {canManageBooks && (
                                <>
                                    <Separator className="my-4" />
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => router.push(`/books/${bookId}/edit`)}
                                        >
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Edit
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="destructive"
                                                    className="flex-1"
                                                    disabled={isDeleting}
                                                >
                                                    {isDeleting ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                    )}
                                                    Delete
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Book</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to delete &quot;{book.title}&quot;?
                                                        This action cannot be undone. All associated
                                                        reservations will also be deleted.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={handleDelete}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </>
                            )}
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
                                    <span>{(book.categories as { name?: string })?.name || 'Uncategorized'}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Location:</span>
                                    <span>{book.location || 'Not specified'}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Loan Period:</span>
                                    <span>{loanDuration} days</span>
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
                                        Books can be borrowed for {loanDuration} days. Please return the book on time
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
