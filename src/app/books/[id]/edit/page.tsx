'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/contexts/OrganizationContext'
import { supabase } from '@/lib/supabase-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Pencil, ArrowLeft, Loader2, Save, ImageIcon } from 'lucide-react'
import { Loading } from '@/components/ui/loading'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'

interface Category {
    category_id: number
    name: string
}

interface Book {
    book_id: number
    title: string
    author: string
    isbn: string
    publisher: string | null
    publish_date: string | null
    description: string | null
    cover_image_url: string | null
    category_id: number | null
    total_copies: number
    available_copies: number
    location: string | null
    organization_id: number
}

export default function EditBookPage() {
    const params = useParams()
    const router = useRouter()
    const bookId = params.id as string
    const { user, loading: authLoading } = useAuth()
    const { currentOrganization, isLoadingOrgs, canManageBooks } = useOrganization()
    const { toast } = useToast()

    // Form state
    const [title, setTitle] = useState('')
    const [author, setAuthor] = useState('')
    const [isbn, setIsbn] = useState('')
    const [publisher, setPublisher] = useState('')
    const [publishDate, setPublishDate] = useState('')
    const [description, setDescription] = useState('')
    const [coverImageUrl, setCoverImageUrl] = useState('')
    const [categoryId, setCategoryId] = useState<string>('')
    const [totalCopies, setTotalCopies] = useState(1)
    const [availableCopies, setAvailableCopies] = useState(1)
    const [location, setLocation] = useState('')

    // UI state
    const [categories, setCategories] = useState<Category[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isLoadingCategories, setIsLoadingCategories] = useState(true)

    const fetchBook = useCallback(async () => {
        if (!currentOrganization || !bookId) return

        try {
            const { data, error } = await supabase
                .from('books')
                .select('*')
                .eq('book_id', bookId)
                .eq('organization_id', currentOrganization.organization_id)
                .single()

            if (error) throw error

            if (!data) {
                toast({
                    title: "Error",
                    description: "Book not found",
                    variant: "destructive",
                })
                router.push('/books')
                return
            }

            const book = data as Book
            setTitle(book.title)
            setAuthor(book.author)
            setIsbn(book.isbn)
            setPublisher(book.publisher || '')
            setPublishDate(book.publish_date || '')
            setDescription(book.description || '')
            setCoverImageUrl(book.cover_image_url || '')
            setCategoryId(book.category_id?.toString() || '')
            setTotalCopies(book.total_copies)
            setAvailableCopies(book.available_copies)
            setLocation(book.location || '')
        } catch (err) {
            console.error('Error fetching book:', err)
            toast({
                title: "Error",
                description: "Failed to load book details",
                variant: "destructive",
            })
            router.push('/books')
        } finally {
            setIsLoading(false)
        }
    }, [bookId, currentOrganization, router, toast])

    const fetchCategories = useCallback(async () => {
        if (!currentOrganization) return

        try {
            const { data, error } = await supabase
                .from('categories')
                .select('category_id, name')
                .or(`organization_id.is.null,organization_id.eq.${currentOrganization.organization_id}`)
                .order('name', { ascending: true })

            if (error) throw error
            setCategories(data || [])
        } catch (err) {
            console.error('Error fetching categories:', err)
        } finally {
            setIsLoadingCategories(false)
        }
    }, [currentOrganization])

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
        }
    }, [user, authLoading, router])

    useEffect(() => {
        if (!isLoadingOrgs && user && !currentOrganization) {
            router.push('/org/select')
        }
    }, [user, isLoadingOrgs, currentOrganization, router])

    useEffect(() => {
        if (!isLoadingOrgs && currentOrganization && !canManageBooks) {
            router.push('/books')
            toast({
                title: "Access Denied",
                description: "You don't have permission to edit books",
                variant: "destructive",
            })
        }
    }, [isLoadingOrgs, currentOrganization, canManageBooks, router, toast])

    useEffect(() => {
        if (currentOrganization) {
            fetchCategories()
            fetchBook()
        }
    }, [currentOrganization, fetchCategories, fetchBook])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Validation
        if (!title.trim()) {
            setError('Title is required')
            return
        }
        if (!author.trim()) {
            setError('Author is required')
            return
        }
        if (!isbn.trim()) {
            setError('ISBN is required')
            return
        }
        if (totalCopies < 1) {
            setError('Total copies must be at least 1')
            return
        }

        // Calculate the difference in total copies to adjust available copies
        const copiesDifference = totalCopies - (totalCopies - availableCopies + availableCopies)
        const newAvailableCopies = Math.max(0, availableCopies + (totalCopies - (totalCopies - copiesDifference)))

        setIsSubmitting(true)

        try {
            const { error: updateError } = await supabase
                .from('books')
                .update({
                    title: title.trim(),
                    author: author.trim(),
                    isbn: isbn.trim(),
                    publisher: publisher.trim() || null,
                    publish_date: publishDate || null,
                    description: description.trim() || null,
                    cover_image_url: coverImageUrl.trim() || null,
                    category_id: categoryId ? parseInt(categoryId) : null,
                    total_copies: totalCopies,
                    location: location.trim() || null
                })
                .eq('book_id', bookId)
                .eq('organization_id', currentOrganization?.organization_id)

            if (updateError) {
                if (updateError.code === '23505') {
                    setError('A book with this ISBN already exists in your organization')
                } else {
                    throw updateError
                }
                return
            }

            toast({
                title: "Success",
                description: "Book updated successfully",
            })

            router.push(`/books/${bookId}`)
        } catch (err) {
            console.error('Error updating book:', err)
            setError('Failed to update book. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (authLoading || isLoadingOrgs || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loading size="lg" />
            </div>
        )
    }

    if (!user || !currentOrganization || !canManageBooks) {
        return null
    }

    return (
        <div className="max-w-3xl mx-auto py-8">
            <Button
                variant="ghost"
                onClick={() => router.push(`/books/${bookId}`)}
                className="mb-6"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Book Details
            </Button>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Pencil className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Edit Book</CardTitle>
                            <CardDescription>
                                Update book information
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Basic Information</h3>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        placeholder="Enter book title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        disabled={isSubmitting}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="author">Author *</Label>
                                    <Input
                                        id="author"
                                        placeholder="Enter author name"
                                        value={author}
                                        onChange={(e) => setAuthor(e.target.value)}
                                        disabled={isSubmitting}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="isbn">ISBN *</Label>
                                    <Input
                                        id="isbn"
                                        placeholder="978-0-000-00000-0"
                                        value={isbn}
                                        onChange={(e) => setIsbn(e.target.value)}
                                        disabled={isSubmitting}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select
                                        value={categoryId}
                                        onValueChange={setCategoryId}
                                        disabled={isSubmitting || isLoadingCategories}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem
                                                    key={category.category_id}
                                                    value={category.category_id.toString()}
                                                >
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    placeholder="Enter book description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    disabled={isSubmitting}
                                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Publishing Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Publishing Information</h3>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="publisher">Publisher</Label>
                                    <Input
                                        id="publisher"
                                        placeholder="Enter publisher name"
                                        value={publisher}
                                        onChange={(e) => setPublisher(e.target.value)}
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="publishDate">Publish Date</Label>
                                    <Input
                                        id="publishDate"
                                        type="date"
                                        value={publishDate}
                                        onChange={(e) => setPublishDate(e.target.value)}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Library Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Library Information</h3>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="totalCopies">Total Copies *</Label>
                                    <Input
                                        id="totalCopies"
                                        type="number"
                                        min={1}
                                        max={9999}
                                        value={totalCopies}
                                        onChange={(e) => setTotalCopies(parseInt(e.target.value) || 1)}
                                        disabled={isSubmitting}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Currently {availableCopies} copies available
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location">Shelf Location</Label>
                                    <Input
                                        id="location"
                                        placeholder="e.g., A-12, Fiction Section"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Cover Image */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Cover Image</h3>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="coverImageUrl">Cover Image URL</Label>
                                    <Input
                                        id="coverImageUrl"
                                        type="url"
                                        placeholder="https://example.com/cover.jpg"
                                        value={coverImageUrl}
                                        onChange={(e) => setCoverImageUrl(e.target.value)}
                                        disabled={isSubmitting}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Enter a URL to an image of the book cover
                                    </p>
                                </div>
                                <div className="flex items-center justify-center">
                                    {coverImageUrl ? (
                                        <div className="relative w-24 h-32 rounded-md overflow-hidden border">
                                            <Image
                                                src={coverImageUrl}
                                                alt="Cover preview"
                                                fill
                                                className="object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none'
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-24 h-32 rounded-md border-2 border-dashed flex items-center justify-center">
                                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Actions */}
                        <div className="flex gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push(`/books/${bookId}`)}
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
