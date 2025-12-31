import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
    title: 'Terms of Service - LibraryOS',
    description: 'Terms of Service for LibraryOS',
}

export default function TermsOfServicePage() {
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
                <h1 className="text-4xl font-display font-bold tracking-tight mb-4">Terms of Service</h1>
                <p className="text-muted-foreground text-lg mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">1. Acceptance of Terms</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        By accessing and using LibraryOS, you accept and agree to be bound by the terms
                        and provisions of this agreement. If you do not agree to these terms, please do not use our service.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">2. Description of Service</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        LibraryOS provides a digital platform for organizations to manage their book collections,
                        track loans and reservations, and facilitate member access to library resources. Our service includes
                        book cataloging, member management, loan tracking, and organizational administration features.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">3. User Accounts</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">To use our service, you must:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                        <li>Create an account with accurate and complete information</li>
                        <li>Maintain the security of your account credentials</li>
                        <li>Notify us immediately of any unauthorized use of your account</li>
                        <li>Be responsible for all activities that occur under your account</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">4. Organization Membership</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                        Users may create or join organizations within the platform. Organization administrators are responsible for:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                        <li>Managing member access and permissions</li>
                        <li>Ensuring compliance with these terms by all organization members</li>
                        <li>Maintaining accurate book inventory and loan records</li>
                        <li>Handling subscription payments and billing (for paid plans)</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">5. Acceptable Use</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">You agree not to:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                        <li>Use the service for any unlawful purpose or in violation of any regulations</li>
                        <li>Upload or share content that infringes on intellectual property rights</li>
                        <li>Attempt to gain unauthorized access to other accounts or systems</li>
                        <li>Interfere with or disrupt the service or servers</li>
                        <li>Use automated systems to access the service without permission</li>
                        <li>Share your account credentials with others</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">6. Subscription and Payments</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Some features require a paid subscription. Subscription fees are billed in advance on a monthly or annual basis.
                        Refunds are provided according to our refund policy. We reserve the right to change pricing with 30 days notice.
                        Failure to pay may result in service suspension or termination.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">7. Intellectual Property</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        LibraryOS, including its original content, features, and functionality, is owned by us
                        and is protected by international copyright, trademark, and other intellectual property laws. You retain
                        ownership of any content you upload but grant us a license to use it for providing our services.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">8. Limitation of Liability</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special,
                        consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or
                        indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use
                        of the service.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">9. Termination</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        We may terminate or suspend your account and access to the service immediately, without prior notice or
                        liability, for any reason, including breach of these terms. Upon termination, your right to use the
                        service will cease immediately. You may also terminate your account at any time through your account settings.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">10. Changes to Terms</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        We reserve the right to modify or replace these terms at any time. If a revision is material, we will
                        provide at least 30 days notice prior to any new terms taking effect. Your continued use of the service
                        after changes become effective constitutes acceptance of the new terms.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">11. Governing Law</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        These terms shall be governed by and construed in accordance with applicable laws, without regard to
                        conflict of law principles. Any disputes arising from these terms will be resolved through binding
                        arbitration or in the courts of competent jurisdiction.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">12. Contact Us</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        If you have any questions about these Terms of Service, please contact us at{' '}
                        <a href="mailto:legal@library-system.com" className="text-primary hover:underline">
                            legal@library-system.com
                        </a>
                    </p>
                </section>
            </article>
        </div>
    )
}
