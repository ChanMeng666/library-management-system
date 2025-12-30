'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Book } from '@/types/book'
import BookCard from '@/components/books/BookCard'
import SearchFilters from '@/components/books/SearchFilters'
import { PaginationContent, PaginationItem } from '@/components/ui/pagination'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronLeft, ChevronRight, Building2, Plus } from 'lucide-react'
import { Loading } from '@/components/ui/loading'
import Link from 'next/link'

export default function BookCatalog() {
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const { currentOrganization, isLoadingOrgs, canManageBooks } = useOrganization()

    const [books, setBooks] = useState<Book[]>([])
    const [categories, setCategories] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const booksPerPage = 12

    const fetchCategories = useCallback(async () => {
        if (!currentOrganization) return

        try {
            // Fetch both global categories and organization-specific categories
            const { data, error } = await supabase
                .from('categories')
                .select('name')
                .or(`organization_id.is.null,organization_id.eq.${currentOrganization.organization_id}`)
                .order('name', { ascending: true })

            if (error) throw error
            // Remove duplicates
            const uniqueCategories = [...new Set(data.map(category => category.name))]
            setCategories(uniqueCategories)
        } catch (error) {
            console.error('Error fetching categories:', error)
        }
    }, [currentOrganization])

    const fetchBooks = useCallback(async () => {
        if (!currentOrganization) {
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        try {
            let query = supabase
                .from('books')
                .select('*', { count: 'exact' })
                .eq('organization_id', currentOrganization.organization_id)
                .order('title', { ascending: true })
                .range((currentPage - 1) * booksPerPage, currentPage * booksPerPage - 1)

            if (searchTerm) {
                query = query.or(`title.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%,isbn.ilike.%${searchTerm}%`)
            }

            if (selectedCategory && selectedCategory !== 'all') {
                // Get category ID first
                const { data: categoryData } = await supabase
                    .from('categories')
                    .select('category_id')
                    .eq('name', selectedCategory)
                    .single()

                if (categoryData) {
                    query = query.eq('category_id', categoryData.category_id)
                }
            }

            const { data, error, count } = await query

            if (error) throw error

            setBooks(data as Book[])
            setTotalPages(Math.ceil((count || 0) / booksPerPage))
        } catch (error) {
            console.error('Error fetching books:', error)
        } finally {
            setIsLoading(false)
        }
    }, [currentOrganization, currentPage, searchTerm, selectedCategory, booksPerPage])

    // Redirect to org select if user is logged in but no organization
    useEffect(() => {
        if (!authLoading && !isLoadingOrgs && user && !currentOrganization) {
            router.push('/org/select')
        }
    }, [user, authLoading, isLoadingOrgs, currentOrganization, router])

    useEffect(() => {
        if (currentOrganization) {
            fetchCategories()
        }
    }, [currentOrganization, fetchCategories])

    useEffect(() => {
        if (currentOrganization) {
            fetchBooks()
        }
    }, [currentOrganization, fetchBooks])

    const handleSearchChange = (value: string) => {
        setSearchTerm(value)
        setCurrentPage(1)
    }

    const handleCategoryChange = (value: string) => {
        setSelectedCategory(value)
        setCurrentPage(1)
    }

    const handlePreviousPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1))
    }

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
    }

    // Show loading while checking auth and org status
    if (authLoading || isLoadingOrgs) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loading size="lg" />
            </div>
        )
    }

    // If user is logged in but no organization selected
    if (user && !currentOrganization) {
        return (
            <div className="text-center py-12">
                <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">No Organization Selected</h2>
                <p className="text-muted-foreground mb-6">
                    Please select or create an organization to browse books.
                </p>
                <Button asChild>
                    <Link href="/org/select">Select Organization</Link>
                </Button>
            </div>
        )
    }

    // If not logged in, show public message
    if (!user) {
        return (
            <div className="text-center py-12">
                <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Welcome to Library Management System</h2>
                <p className="text-muted-foreground mb-6">
                    Sign in to access your organization&apos;s book catalog.
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Book Catalog</h1>
                    <p className="text-muted-foreground flex items-center gap-2 mt-1">
                        <Building2 className="h-4 w-4" />
                        {currentOrganization?.name}
                    </p>
                </div>
                {canManageBooks && (
                    <Button asChild>
                        <Link href="/books/add">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Book
                        </Link>
                    </Button>
                )}
            </div>

            <SearchFilters
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
                categories={categories}
            />

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 12 }).map((_, index) => (
                        <div
                            key={`skeleton-${index}`}
                            className="h-64 bg-gray-200 rounded-lg animate-pulse"
                        />
                    ))}
                </div>
            ) : (
                <>
                    {books.length === 0 ? (
                        <div className="text-center py-12">
                            <h2 className="text-2xl font-semibold mb-2">No books found</h2>
                            <p className="text-muted-foreground mb-4">
                                {searchTerm || selectedCategory !== 'all'
                                    ? "Try adjusting your search or filters to find what you're looking for."
                                    : "Your library catalog is empty."
                                }
                            </p>
                            {canManageBooks && !searchTerm && selectedCategory === 'all' && (
                                <Button asChild>
                                    <Link href="/books/add">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Your First Book
                                    </Link>
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {books.map((book) => (
                                <BookCard key={book.book_id} book={book} />
                            ))}
                        </div>
                    )}

                    {totalPages > 1 && (
                        <nav className="flex justify-center mt-8">
                            <PaginationContent>
                                <PaginationItem>
                                    <Button
                                        variant="outline"
                                        onClick={handlePreviousPage}
                                        disabled={currentPage === 1}
                                        className="mr-2"
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        Previous
                                    </Button>
                                </PaginationItem>

                                <PaginationItem>
                                    <span className="flex items-center px-4">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                </PaginationItem>

                                <PaginationItem>
                                    <Button
                                        variant="outline"
                                        onClick={handleNextPage}
                                        disabled={currentPage === totalPages}
                                        className="ml-2"
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </PaginationItem>
                            </PaginationContent>
                        </nav>
                    )}
                </>
            )}
        </div>
    )
}
