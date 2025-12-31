import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
    title: 'Privacy Policy - LibraryOS',
    description: 'Privacy Policy for LibraryOS',
}

export default function PrivacyPolicyPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="mb-8">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Home
                    </Link>
                </Button>
            </div>

            <article className="prose prose-neutral dark:prose-invert max-w-none">
                <h1 className="text-4xl font-display font-bold tracking-tight mb-4">Privacy Policy</h1>
                <p className="text-muted-foreground text-lg mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">1. Introduction</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Welcome to LibraryOS. We respect your privacy and are committed to protecting your personal data.
                        This privacy policy will inform you about how we look after your personal data when you visit our website and
                        tell you about your privacy rights and how the law protects you.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">2. Information We Collect</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">We may collect, use, store and transfer different kinds of personal data about you:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                        <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier</li>
                        <li><strong>Contact Data:</strong> includes email address</li>
                        <li><strong>Technical Data:</strong> includes internet protocol (IP) address, browser type and version, time zone setting and location</li>
                        <li><strong>Usage Data:</strong> includes information about how you use our website and services</li>
                        <li><strong>Library Data:</strong> includes information about books borrowed, reading history, and reservations</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">3. How We Use Your Information</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">We use your personal data for the following purposes:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                        <li>To provide and maintain our library management services</li>
                        <li>To manage your account and organization membership</li>
                        <li>To process book loans, returns, and reservations</li>
                        <li>To send you important notifications about due dates and overdue items</li>
                        <li>To improve our services and user experience</li>
                        <li>To comply with legal obligations</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">4. Data Security</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        We have implemented appropriate security measures to prevent your personal data from being accidentally lost,
                        used or accessed in an unauthorized way, altered or disclosed. We use industry-standard encryption and secure
                        servers to protect your data. Access to your personal data is limited to employees and contractors who need
                        it to perform their duties.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">5. Data Retention</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for,
                        including for the purposes of satisfying any legal, accounting, or reporting requirements. When you delete
                        your account, we will delete or anonymize your personal data within 30 days.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">6. Your Rights</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">Under data protection laws, you have rights including:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                        <li><strong>Access:</strong> You can request copies of your personal data</li>
                        <li><strong>Correction:</strong> You can request that we correct inaccurate or incomplete data</li>
                        <li><strong>Erasure:</strong> You can request that we delete your personal data</li>
                        <li><strong>Portability:</strong> You can request that we transfer your data to another organization</li>
                        <li><strong>Objection:</strong> You can object to certain types of processing</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">7. Third-Party Services</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Our service may use third-party services for authentication, payment processing, and analytics.
                        These services have their own privacy policies, and we encourage you to review them. We use Supabase
                        for authentication and database services, and Stripe for payment processing.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">8. Changes to This Policy</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        We may update this privacy policy from time to time. We will notify you of any changes by posting the
                        new privacy policy on this page and updating the &quot;Last updated&quot; date. We encourage you to review this
                        policy periodically.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">9. Contact Us</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        If you have any questions about this privacy policy or our privacy practices, please contact us at{' '}
                        <a href="mailto:privacy@library-system.com" className="text-primary hover:underline">
                            privacy@library-system.com
                        </a>
                    </p>
                </section>
            </article>
        </div>
    )
}
