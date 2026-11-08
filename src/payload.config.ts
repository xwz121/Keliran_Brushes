import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { en } from '@payloadcms/translations/languages/en'
import { zh } from '@payloadcms/translations/languages/zh'
import sharp from 'sharp'
import { SiteSettings } from './globals/site-settings'
import {
  Solutions,
  Cases,
  Guides,
  Faqs,
  Applications,
  Categories,
  Glossary,
  Inquiries,
  Materials,
  Media,
  MigrationRecords,
  Pages,
  Products,
  RateLimits,
  Users,
} from './collections'
import { localeNames, locales } from './lib/locales'
import { allowedOrigins, isProductionDeployment, serviceStatus, siteURL } from './lib/env'
import { mediaPrefix, siteName } from './lib/site'
import { postmarkConfigured, postmarkEmailAdapter } from './lib/postmark'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const configured = serviceStatus()
if (!process.env.PAYLOAD_SECRET)
  throw new Error('PAYLOAD_SECRET is required. Run pnpm setup:local for development.')
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.')
if (isProductionDeployment && !configured.storage)
  throw new Error('Production requires complete R2 storage configuration.')
export default buildConfig({
  secret: process.env.PAYLOAD_SECRET,
  serverURL: siteURL,
  // Distinct cookie names keep this admin separate from keliran.com when both run on 127.0.0.1.
  cookiePrefix: 'keliran-brushes',
  telemetry: false,
  admin: {
    user: 'users',
    meta: { titleSuffix: `— ${siteName}` },
    importMap: { baseDir: path.resolve(dirname) },
    components: {
      graphics: {
        Logo: '/components/admin/Logo#AdminLogo',
        Icon: '/components/admin/Logo#AdminIcon',
      },
    },
  },
  i18n: { fallbackLanguage: 'zh', supportedLanguages: { en, zh } },
  localization: {
    locales: locales.map((code) => ({ code, label: localeNames[code] })),
    defaultLocale: 'en',
    fallback: false,
  },
  globals: [SiteSettings],
  collections: [
    Solutions,
    Cases,
    Guides,
    Faqs,
    Users,
    Products,
    Categories,
    Materials,
    Applications,
    Pages,
    Media,
    Inquiries,
    Glossary,
    RateLimits,
    MigrationRecords,
  ],
  editor: lexicalEditor(),
  db: postgresAdapter({
    // Each serverless instance keeps its own pool; both Keliran sites share one RDS instance's
    // connection limit, so the size is adjustable (default 5).
    pool: { connectionString: process.env.DATABASE_URL, max: Number(process.env.DATABASE_POOL_MAX) || 5 },
    push:
      process.env.NODE_ENV !== 'production' &&
      ['localhost', '127.0.0.1', '::1'].includes(new URL(process.env.DATABASE_URL!).hostname),
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  sharp,
  upload: { limits: { fileSize: 4 * 1024 * 1024 }, abortOnLimit: true },
  cors: allowedOrigins,
  csrf: allowedOrigins,
  email: postmarkConfigured()
    ? postmarkEmailAdapter({ defaultFromAddress: process.env.EMAIL_FROM!, defaultFromName: siteName })
    : () => ({
        name: 'not-configured',
        defaultFromAddress: 'no-reply@localhost',
        defaultFromName: siteName,
        sendEmail: async () => {
          throw new Error('Email service is not configured.')
        },
      }),
  plugins: [
    s3Storage({
      enabled: configured.storage,
      // Keep the media schema identical when generating migrations without R2 credentials.
      alwaysInsertFields: true,
      bucket: process.env.R2_BUCKET || '',
      collections: {
        media: {
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) =>
            `${process.env.R2_PUBLIC_URL}/${prefix ? `${prefix}/` : ''}${encodeURIComponent(filename)}`,
          prefix: mediaPrefix,
        },
      },
      config: {
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT,
        forcePathStyle: true,
      },
    }),
  ],
  jobs: {
    access: { run: () => false },
    tasks: [
      {
        // Internal sales notification: a duplicate is harmless, so temporary failures retry.
        slug: 'inquiry-email',
        retries: { attempts: 5, backoff: { type: 'exponential', delay: 30000 } },
        inputSchema: [{ name: 'inquiryId', type: 'number', required: true }],
        handler: async ({ input, req }) => {
          const { sendInquiryEmail } = await import('./lib/inquiries')
          await sendInquiryEmail(req.payload, input.inquiryId)
          return { output: {} }
        },
      },
      {
        // Customer acknowledgement: sent at most once; only a definite non-acceptance retries.
        slug: 'inquiry-auto-reply',
        retries: { attempts: 3, backoff: { type: 'exponential', delay: 30000 } },
        onFail: async ({ input, req, taskStatus }) => {
          const id = (input as { inquiryId?: number })?.inquiryId
          if (id && (taskStatus?.totalTried || 0) >= 3) {
            const { failPendingAutoReply } = await import('./lib/inquiry-auto-reply')
            await failPendingAutoReply(req.payload, id)
          }
        },
        inputSchema: [{ name: 'inquiryId', type: 'number', required: true }],
        handler: async ({ input, req }) => {
          const { sendInquiryAutoReply } = await import('./lib/inquiry-auto-reply')
          await sendInquiryAutoReply(req.payload, input.inquiryId)
          return { output: {} }
        },
      },
    ],
  },
})
