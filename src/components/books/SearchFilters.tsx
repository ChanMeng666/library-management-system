import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Search, Filter } from 'lucide-react'

type SearchFiltersProps = {
    searchTerm: string
    onSearchChange: (value: string) => void
    selectedCategory: string
    onCategoryChange: (value: string) => void
    categories: string[]
}

export default function SearchFilters({
                                          searchTerm,
                                          onSearchChange,
                                          selectedCategory,
                                          onCategoryChange,
                                          categories,
                                      }: SearchFiltersProps) {
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xs border mb-6">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <Label htmlFor="search" className="mb-2">
                        Search Books
                    </Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="search"
                            type="text"
                            placeholder="Search by title, author, or ISBN..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>
                <div className="w-full md:w-48">
                    <Label htmlFor="category" className="mb-2">
                        Category
                    </Label>
                    <Select value={selectedCategory} onValueChange={onCategoryChange}>
                        <SelectTrigger id="category">
                            <Filter className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                    {category}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    )
}
