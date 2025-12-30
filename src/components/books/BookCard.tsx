'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Book } from '@/types/book'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Eye, User } from 'lucide-react'

type BookCardProps = {
    book: Book
    showQuickActions?: boolean
}

export default function BookCard({ book, showQuickActions = true }: BookCardProps) {
    const isAvailable = book.available_copies > 0

    return (
        <Card className="group h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            {/* Image Container */}
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
                <Image
                    src={book.cover_image_url || '/images/placeholder.jpg'}
                    alt={book.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />

                {/* Gradient Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Availability Badge */}
                <div className="absolute top-3 right-3 z-10">
                    <Badge
                        variant={isAvailable ? 'success' : 'secondary'}
                        className="shadow-lg"
                    >
                        {isAvailable ? `${book.available_copies} Available` : 'Unavailable'}
                    </Badge>
                </div>

                {/* Quick Actions on Hover */}
                {showQuickActions && (
                    <div className="absolute bottom-4 left-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 z-10">
                        <Button
                            variant="gradient"
                            size="sm"
                            className="flex-1"
                            asChild
                        >
                            <Link href={`/books/${book.book_id}`}>
                                <BookOpen className="mr-2 h-4 w-4" />
                                {isAvailable ? 'Borrow' : 'Reserve'}
                            </Link>
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="bg-white/90 hover:bg-white text-black"
                            asChild
                        >
                            <Link href={`/books/${book.book_id}`}>
                                <Eye className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                )}
            </div>

            {/* Content */}
            <CardContent className="flex-1 p-4">
                <Link
                    href={`/books/${book.book_id}`}
                    className="block group/title"
                >
                    <h3 className="font-display font-semibold text-lg line-clamp-1 mb-1 group-hover/title:text-primary transition-colors">
                        {book.title}
                    </h3>
                </Link>

                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                    <User className="h-3.5 w-3.5" />
                    <span className="line-clamp-1">{book.author}</span>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {book.description || 'No description available for this book.'}
                </p>

                {/* Category Tag */}
                {book.category_name && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                        <Badge variant="outline" className="text-xs">
                            {book.category_name}
                        </Badge>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
