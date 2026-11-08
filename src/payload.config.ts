import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { resendAdapter } from '@payloadcms/email-resend'
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
  TranslationRuns,
  Users,
} from './collections'
import { localeNames, locales } from './lib/locales'
import { allowedOrigins, isProductionDeployment, serviceStatus, siteURL } from './lib/env'
import { mediaPrefix, siteName } from './lib/site'

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
      beforeDashboard: ['/components/admin/TranslationCenter#TranslationCenter'],
      views: {
        translationCenter: {
          Component: '/components/admin/TranslationCenter#TranslationCenter',
          path: '/translation-center',
        },
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
    TranslationRuns,
    Glossary,
    RateLimits,
    MigrationRecords,
  ],
  editor: lexicalEditor(),
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL, max: 5 },
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
  email:
    process.env.RESEND_API_KEY && process.env.EMAIL_FROM
      ? resendAdapter({
          apiKey: process.env.RESEND_API_KEY,
          defaultFromAddress: process.env.EMAIL_FROM,
          defaultFromName: 'Keliran',
        })
      : () => ({
          name: 'not-configured',
          defaultFromAddress: 'no-reply@localhost',
          defaultFromName: 'Keliran',
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
        slug: 'translation-step',
        retries: { attempts: 3, backoff: { type: 'exponential', delay: 60000 } },
        onFail: async ({ input, req, taskStatus }) => {
          if ((taskStatus?.totalTried || 0) >= 3) {
            const id = (input as { runId?: number })?.runId
            if (id)
              await req.payload.update({
                collection: 'translation-runs',
                where: { and: [{ id: { equals: id } }, { status: { in: ['queued', 'running'] } }] },
                data: { status: 'failed', error: '服务调用失败且已耗尽重试，请查看任务日志并重新运行。' },
              })
          }
        },
        inputSchema: [
          { name: 'runId', type: 'number', required: true },
          { name: 'locale', type: 'text', required: true },
          { name: 'stage', type: 'text', required: true },
          { name: 'round', type: 'number', defaultValue: 0 },
        ],
        handler: async ({ input, req }) => {
          const { runTranslationStep } = await import('./lib/ai/workflow')
          await runTranslationStep(req.payload, input)
          return { output: {} }
        },
      },
      {
        slug: 'inquiry-email',
        retries: 3,
        inputSchema: [{ name: 'inquiryId', type: 'number', required: true }],
        handler: async ({ input, req }) => {
          const { sendInquiryEmail } = await import('./lib/inquiries')
          await sendInquiryEmail(req.payload, input.inquiryId)
          return { output: {} }
        },
      },
    ],
  },
})
