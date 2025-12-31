import { Resend } from 'resend'

// Initialize Resend client
const resendApiKey = process.env.RESEND_API_KEY

if (!resendApiKey) {
    console.warn('RESEND_API_KEY is not set. Email functionality will not work.')
}

// Only create Resend client if API key is available
export const resend = resendApiKey ? new Resend(resendApiKey) : null

// Default sender email (must be verified in Resend)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com'
const FROM_NAME = process.env.RESEND_FROM_NAME || 'LibraryOS'

// Email types
export type EmailType =
    | 'welcome'
    | 'invitation'
    | 'invitation_accepted'
    | 'subscription_created'
    | 'subscription_updated'
    | 'subscription_canceled'
    | 'payment_failed'
    | 'book_borrowed'
    | 'book_due_soon'
    | 'book_overdue'
    | 'reservation_ready'

interface EmailData {
    userName?: string
    organizationName?: string
    inviterName?: string
    inviteUrl?: string
    role?: string
    planName?: string
    bookTitle?: string
    dueDate?: string
    invoiceUrl?: string
    loginUrl?: string
}

interface SendEmailParams {
    to: string
    type: EmailType
    data: EmailData
}

// Send email based on type
export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
    if (!resend) {
        console.warn('Skipping email send: RESEND_API_KEY not configured')
        return { success: false, error: 'Email service not configured' }
    }

    const { to, type, data } = params
    const template = getEmailTemplate(type, data)

    try {
        const result = await resend.emails.send({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to,
            subject: template.subject,
            html: template.html,
        })

        if (result.error) {
            console.error('Resend error:', result.error)
            return { success: false, error: result.error.message }
        }

        return { success: true }
    } catch (error) {
        console.error('Email send error:', error)
        return { success: false, error: 'Failed to send email' }
    }
}

// Convenience functions for specific email types
export async function sendWelcomeEmail(to: string, userName: string) {
    return sendEmail({
        to,
        type: 'welcome',
        data: { userName },
    })
}

export async function sendInvitationEmail(
    to: string,
    data: { inviterName: string; organizationName: string; inviteUrl: string; role: string }
) {
    return sendEmail({
        to,
        type: 'invitation',
        data,
    })
}

export async function sendSubscriptionEmail(params: {
    to: string
    type: 'subscription_created' | 'subscription_updated' | 'subscription_canceled' | 'payment_failed'
    data: EmailData
}) {
    return sendEmail(params)
}

export async function sendBookNotificationEmail(params: {
    to: string
    type: 'book_borrowed' | 'book_due_soon' | 'book_overdue' | 'reservation_ready'
    data: EmailData
}) {
    return sendEmail(params)
}

// Email templates
function getEmailTemplate(type: EmailType, data: EmailData): { subject: string; html: string } {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'
    const logoUrl = `${appUrl}/libraryos-logo.svg`

    const baseStyles = `
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
        .logo { height: 40px; width: 40px; }
        .content { padding: 30px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; }
        .button:hover { background-color: #0060df; }
        .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; font-size: 14px; }
        h1 { color: #111; font-size: 24px; margin-bottom: 16px; }
        p { margin: 16px 0; }
        .highlight { background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0; }
    `

    const wrapHtml = (content: string, subject: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>${baseStyles}</style>
</head>
<body>
    <div class="header">
        <img src="${logoUrl}" alt="LibraryOS" class="logo">
        <h2 style="margin: 10px 0 0; color: #333;">LibraryOS</h2>
    </div>
    <div class="content">
        ${content}
    </div>
    <div class="footer">
        <p>&copy; ${new Date().getFullYear()} LibraryOS. All rights reserved.</p>
        <p><a href="${appUrl}">Visit our website</a></p>
    </div>
</body>
</html>
    `

    switch (type) {
        case 'welcome':
            return {
                subject: 'Welcome to LibraryOS!',
                html: wrapHtml(`
                    <h1>Welcome, ${data.userName || 'there'}!</h1>
                    <p>Thank you for joining LibraryOS. We're excited to have you on board!</p>
                    <p>With our platform, you can:</p>
                    <ul>
                        <li>Manage your library's book collection</li>
                        <li>Track borrowing and returns</li>
                        <li>Invite team members to your organization</li>
                        <li>Access detailed analytics and reports</li>
                    </ul>
                    <p style="text-align: center; margin-top: 30px;">
                        <a href="${appUrl}/dashboard" class="button">Go to Dashboard</a>
                    </p>
                `, 'Welcome to LibraryOS!'),
            }

        case 'invitation':
            return {
                subject: `You're invited to join ${data.organizationName}`,
                html: wrapHtml(`
                    <h1>You've been invited!</h1>
                    <p>${data.inviterName || 'Someone'} has invited you to join <strong>${data.organizationName}</strong> as a <strong>${data.role || 'member'}</strong>.</p>
                    <div class="highlight">
                        <p><strong>Organization:</strong> ${data.organizationName}</p>
                        <p><strong>Your Role:</strong> ${data.role || 'Member'}</p>
                    </div>
                    <p>Click the button below to accept the invitation:</p>
                    <p style="text-align: center; margin-top: 30px;">
                        <a href="${data.inviteUrl}" class="button">Accept Invitation</a>
                    </p>
                    <p style="font-size: 14px; color: #666; margin-top: 30px;">
                        This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
                    </p>
                `, `You're invited to join ${data.organizationName}`),
            }

        case 'invitation_accepted':
            return {
                subject: `${data.userName} has joined ${data.organizationName}`,
                html: wrapHtml(`
                    <h1>New Member Joined!</h1>
                    <p><strong>${data.userName}</strong> has accepted your invitation and joined <strong>${data.organizationName}</strong>.</p>
                    <p style="text-align: center; margin-top: 30px;">
                        <a href="${appUrl}/org/members" class="button">View Team Members</a>
                    </p>
                `, `${data.userName} has joined ${data.organizationName}`),
            }

        case 'subscription_created':
            return {
                subject: `Subscription Activated for ${data.organizationName}`,
                html: wrapHtml(`
                    <h1>Welcome to Premium!</h1>
                    <p>Hi ${data.userName || 'there'},</p>
                    <p>Your subscription for <strong>${data.organizationName}</strong> has been activated successfully.</p>
                    <div class="highlight">
                        <p><strong>Plan:</strong> ${data.planName || 'Premium'}</p>
                        <p>You now have access to all premium features!</p>
                    </div>
                    <p style="text-align: center; margin-top: 30px;">
                        <a href="${appUrl}/org/billing" class="button">Manage Subscription</a>
                    </p>
                `, `Subscription Activated for ${data.organizationName}`),
            }

        case 'subscription_updated':
            return {
                subject: `Subscription Updated for ${data.organizationName}`,
                html: wrapHtml(`
                    <h1>Subscription Updated</h1>
                    <p>Hi ${data.userName || 'there'},</p>
                    <p>Your subscription for <strong>${data.organizationName}</strong> has been updated.</p>
                    <div class="highlight">
                        <p><strong>New Plan:</strong> ${data.planName || 'Updated Plan'}</p>
                    </div>
                    <p style="text-align: center; margin-top: 30px;">
                        <a href="${appUrl}/org/billing" class="button">View Details</a>
                    </p>
                `, `Subscription Updated for ${data.organizationName}`),
            }

        case 'subscription_canceled':
            return {
                subject: `Subscription Canceled for ${data.organizationName}`,
                html: wrapHtml(`
                    <h1>Subscription Canceled</h1>
                    <p>Hi ${data.userName || 'there'},</p>
                    <p>Your subscription for <strong>${data.organizationName}</strong> has been canceled.</p>
                    <p>You'll continue to have access to your current plan until the end of your billing period.</p>
                    <p>We're sorry to see you go! If you change your mind, you can always resubscribe.</p>
                    <p style="text-align: center; margin-top: 30px;">
                        <a href="${appUrl}/org/billing" class="button">Resubscribe</a>
                    </p>
                `, `Subscription Canceled for ${data.organizationName}`),
            }

        case 'payment_failed':
            return {
                subject: `Payment Failed for ${data.organizationName}`,
                html: wrapHtml(`
                    <h1>Payment Failed</h1>
                    <p>Hi ${data.userName || 'there'},</p>
                    <p>We were unable to process your payment for <strong>${data.organizationName}</strong>.</p>
                    <p>Please update your payment method to avoid any interruption in service.</p>
                    <p style="text-align: center; margin-top: 30px;">
                        <a href="${data.invoiceUrl || `${appUrl}/org/billing`}" class="button">Update Payment Method</a>
                    </p>
                `, `Payment Failed for ${data.organizationName}`),
            }

        case 'book_borrowed':
            return {
                subject: `Book Borrowed: ${data.bookTitle}`,
                html: wrapHtml(`
                    <h1>Book Borrowed</h1>
                    <p>Hi ${data.userName || 'there'},</p>
                    <p>You have successfully borrowed <strong>${data.bookTitle}</strong>.</p>
                    <div class="highlight">
                        <p><strong>Due Date:</strong> ${data.dueDate}</p>
                    </div>
                    <p>Please return the book by the due date to avoid late fees.</p>
                    <p style="text-align: center; margin-top: 30px;">
                        <a href="${appUrl}/dashboard" class="button">View My Books</a>
                    </p>
                `, `Book Borrowed: ${data.bookTitle}`),
            }

        case 'book_due_soon':
            return {
                subject: `Reminder: ${data.bookTitle} is due soon`,
                html: wrapHtml(`
                    <h1>Book Due Soon</h1>
                    <p>Hi ${data.userName || 'there'},</p>
                    <p>This is a friendly reminder that <strong>${data.bookTitle}</strong> is due soon.</p>
                    <div class="highlight">
                        <p><strong>Due Date:</strong> ${data.dueDate}</p>
                    </div>
                    <p>Please return the book by the due date to avoid late fees.</p>
                    <p style="text-align: center; margin-top: 30px;">
                        <a href="${appUrl}/dashboard" class="button">View My Books</a>
                    </p>
                `, `Reminder: ${data.bookTitle} is due soon`),
            }

        case 'book_overdue':
            return {
                subject: `Overdue Notice: ${data.bookTitle}`,
                html: wrapHtml(`
                    <h1>Book Overdue</h1>
                    <p>Hi ${data.userName || 'there'},</p>
                    <p><strong>${data.bookTitle}</strong> is now overdue.</p>
                    <div class="highlight" style="background-color: #fff3cd;">
                        <p><strong>Due Date:</strong> ${data.dueDate}</p>
                        <p>Please return the book as soon as possible.</p>
                    </div>
                    <p style="text-align: center; margin-top: 30px;">
                        <a href="${appUrl}/dashboard" class="button">View My Books</a>
                    </p>
                `, `Overdue Notice: ${data.bookTitle}`),
            }

        case 'reservation_ready':
            return {
                subject: `Your Reserved Book is Ready: ${data.bookTitle}`,
                html: wrapHtml(`
                    <h1>Your Book is Ready!</h1>
                    <p>Hi ${data.userName || 'there'},</p>
                    <p>Great news! <strong>${data.bookTitle}</strong> is now available for pickup.</p>
                    <p>Please visit the library to borrow your book. The reservation will be held for 3 days.</p>
                    <p style="text-align: center; margin-top: 30px;">
                        <a href="${appUrl}/books" class="button">View Book</a>
                    </p>
                `, `Your Reserved Book is Ready: ${data.bookTitle}`),
            }

        default:
            return {
                subject: 'Notification from LibraryOS',
                html: wrapHtml(`
                    <h1>Notification</h1>
                    <p>You have a new notification from LibraryOS.</p>
                    <p style="text-align: center; margin-top: 30px;">
                        <a href="${appUrl}" class="button">Visit Dashboard</a>
                    </p>
                `, 'Notification from LibraryOS'),
            }
    }
}
