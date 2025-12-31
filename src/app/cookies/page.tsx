import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
    title: 'Cookie Policy - LibraryOS',
    description: 'Cookie Policy for LibraryOS',
}

export default function CookiePolicyPage() {
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
                <h1 className="text-4xl font-display font-bold tracking-tight mb-4">Cookie Policy</h1>
                <p className="text-muted-foreground text-lg mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">1. What Are Cookies</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Cookies are small text files that are placed on your computer or mobile device when you visit a website.
                        They are widely used to make websites work more efficiently and to provide information to website owners.
                        Cookies help us improve your experience by remembering your preferences and understanding how you use our service.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">2. How We Use Cookies</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                        We use cookies for the following purposes:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                        <li><strong>Authentication:</strong> To keep you signed in and maintain your session</li>
                        <li><strong>Preferences:</strong> To remember your settings like theme preference (light/dark mode)</li>
                        <li><strong>Security:</strong> To protect your account and prevent fraud</li>
                        <li><strong>Analytics:</strong> To understand how visitors interact with our website</li>
                        <li><strong>Performance:</strong> To ensure the website loads quickly and functions properly</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">3. Types of Cookies We Use</h2>

                    <div className="mb-6">
                        <h3 className="text-xl font-display font-medium mb-3">Essential Cookies</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            These cookies are necessary for the website to function properly. They enable core functionality
                            such as security, account access, and session management. You cannot opt out of these cookies
                            as the service would not work without them.
                        </p>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-xl font-display font-medium mb-3">Functional Cookies</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            These cookies allow us to remember choices you make (such as your preferred language or theme)
                            and provide enhanced, personalized features. They may also be used to provide services you have
                            requested, such as remembering your organization selection.
                        </p>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-xl font-display font-medium mb-3">Analytics Cookies</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            These cookies help us understand how visitors interact with our website by collecting and
                            reporting information anonymously. This helps us improve our service and user experience.
                            We may use third-party analytics services that set their own cookies.
                        </p>
                    </div>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">4. Third-Party Cookies</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                        We may use third-party services that set their own cookies:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                        <li><strong>Supabase:</strong> For authentication and session management</li>
                        <li><strong>Stripe:</strong> For payment processing (if you use paid features)</li>
                        <li><strong>Vercel Analytics:</strong> For understanding website performance and usage</li>
                    </ul>
                    <p className="text-muted-foreground leading-relaxed mt-4">
                        These third-party services have their own privacy and cookie policies. We encourage you to review them.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">5. Cookie Duration</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                        Cookies can be either session cookies or persistent cookies:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                        <li><strong>Session cookies:</strong> These are temporary and are deleted when you close your browser</li>
                        <li><strong>Persistent cookies:</strong> These remain on your device for a set period or until you delete them</li>
                    </ul>
                    <p className="text-muted-foreground leading-relaxed mt-4">
                        Our authentication cookies typically last for 7-30 days depending on your session preferences.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">6. Managing Cookies</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                        You can control and manage cookies in several ways:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                        <li><strong>Browser settings:</strong> Most browsers allow you to refuse or accept cookies and delete existing cookies</li>
                        <li><strong>Private browsing:</strong> Use incognito or private browsing mode to prevent cookies from being stored</li>
                        <li><strong>Cookie management tools:</strong> Use browser extensions to manage cookies more granularly</li>
                    </ul>
                    <p className="text-muted-foreground leading-relaxed mt-4">
                        Please note that blocking or deleting cookies may impact your ability to use our service,
                        as some features require cookies to function properly.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">7. Browser-Specific Instructions</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                        Here are links to manage cookies in popular browsers:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Chrome</a></li>
                        <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mozilla Firefox</a></li>
                        <li><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Safari</a></li>
                        <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Microsoft Edge</a></li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">8. Updates to This Policy</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        We may update this Cookie Policy from time to time to reflect changes in our practices or for
                        legal or regulatory reasons. We will post any changes on this page and update the &quot;Last updated&quot;
                        date. We encourage you to review this policy periodically.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-display font-semibold mb-4">9. Contact Us</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        If you have any questions about our use of cookies, please contact us at{' '}
                        <a href="mailto:privacy@library-system.com" className="text-primary hover:underline">
                            privacy@library-system.com
                        </a>
                    </p>
                </section>
            </article>
        </div>
    )
}
