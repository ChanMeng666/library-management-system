import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Library Management System',
    description: 'A modern library management system',
    icons: {
        icon: '/library-management-system-logo.svg',
        apple: '/library-management-system-logo.svg',
    },
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
        <body className={inter.className}>
        <AuthProvider>
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 container mx-auto px-4 py-8">
                    {children}
                </main>
                <Footer />
            </div>
            <Toaster />
        </AuthProvider>
        </body>
        </html>
    )
}
