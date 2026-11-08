// What makes this deployment the strip-brush site. The sealing site (keliran.com)
// runs the same code shape with its own values here, so shared fixes can move
// between the two repositories without touching product-line logic.
export const siteLine = 'brushes' as const
export const otherLine = 'sealing' as const
export type SiteLine = typeof siteLine
// Content visible to anonymous visitors: this line plus documents shared by both lines.
export const visibleLines = [siteLine, 'both'] as const
export const siteLineWhere = { line: { in: [...visibleLines] } }
export const siteName = 'Keliran Strip Brushes'
// Interface copy key naming this site's product line (used in the enquiry acknowledgement).
export const siteLineCopyKey = 'brushesTitle' as const
// Category guide pages live under this path: /:locale/strip-brushes/:category.
export const categoryRoute = 'strip-brushes'
export const productionSiteURL = 'https://brushes.keliran.com'
// The other product line lives on its own site; enquiries for it are refused with `line-moved`.
export const otherSiteURL = 'https://keliran.com'
// Local development port; the sealing site keeps 3000 and Paperclip uses 3100.
export const devPort = 3200
// Object-storage prefixes inside the R2 buckets shared with keliran.com.
export const mediaPrefix = 'brushes'
export const inquiryFilePrefix = 'brushes/inquiries/'
// Draft-preview cookie; named per site so both admins can preview side by side locally.
export const previewCookie = 'keliran-brushes-preview'
