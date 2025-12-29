import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
    return (
        <footer className="border-t bg-background">
            <div className="container flex flex-col items-center gap-4 py-6 md:h-20 md:flex-row md:justify-between">
                <Link href="/" className="flex items-center space-x-2">
                    <Image
                        src="/library-management-system-logo.svg"
                        alt="Library Management System"
                        width={24}
                        height={24}
                        className="rounded"
                    />
                    <Image
                        src="/library-management-system-brand.svg"
                        alt="Library Management System"
                        width={100}
                        height={24}
                        className="dark:invert"
                    />
                </Link>
                <div className="text-center text-sm leading-loose text-muted-foreground">
                    Built with ♥️ by Chan Meng. © {new Date().getFullYear()} All rights reserved.
                </div>
            </div>
        </footer>
    )
}
