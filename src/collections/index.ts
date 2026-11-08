import type { Access, CollectionConfig, Field, PayloadRequest } from 'payload'
import { randomUUID } from 'node:crypto'
import { lock } from '@/lib/transactions'
import { assertPublishable } from '@/lib/publish-checks'
import { autoReplyStatuses } from '@/lib/inquiry-auto-reply'
import { routeFor } from '@/lib/routes'
import { locales } from '@/lib/locales'
import { siteLine, siteLineWhere } from '@/lib/site'

export const staff = ({ req }: { req: PayloadRequest }) => Boolean(req.user)
const admin = ({ req }: { req: PayloadRequest }) => req.user?.role === 'admin'
const published: Access = ({ req }) => (req.user ? true : { _status: { equals: 'published' } })
// Anonymous visitors (pages, REST/GraphQL, sitemap, llms.txt) only see this site's line
// and shared documents. Records of the other line stay in the database for traceability.
const publishedOnSite: Access = ({ req }) =>
  req.user ? true : { and: [{ _status: { equals: 'published' } }, siteLineWhere] }
export const contentSlugs = [
  'products',
  'categories',
  'materials',
  'applications',
  'pages',
  'solutions',
  'cases',
  'guides',
  'faqs',
] as const
export type ContentSlug = (typeof contentSlugs)[number]
export const isContentSlug = (s: string): s is ContentSlug => contentSlugs.includes(s as ContentSlug)

const localizedText = (name: string, label: string, type: 'text' | 'textarea' = 'text'): Field =>
  ({ name, label, type, localized: true }) as Field
const contentFields: Field[] = [
  {
    name: 'slug',
    type: 'text',
    required: true,
    unique: true,
    index: true,
    label: '网址标识',
    validate: (value: unknown) =>
      typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
        ? true
        : '请使用小写英文字母、数字和连字符。',
  },
  localizedText('title', '名称 / 标题'),
  localizedText('summary', '摘要', 'textarea'),
  localizedText('description', '详细介绍', 'textarea'),
  {
    name: 'sections',
    type: 'array',
    label: '内容区块',
    fields: [
      { name: 'key', type: 'text', required: true, label: '区块标识' },
      localizedText('heading', '标题'),
      localizedText('text', '正文', 'textarea'),
    ],
  },
  { name: 'sortOrder', type: 'number', defaultValue: 0, label: '排序' },
  {
    name: 'factsConfirmed',
    type: 'checkbox',
    defaultValue: false,
    label: '产品事实与素材已确认',
    admin: {
      description:
        '确认当前版本的供货描述、技术信息和配图已获准用于官网。发布时还会检查八种语言是否齐全，并与英文的数字、单位、结构和术语一致。',
    },
  },
  localizedText('seoTitle', 'SEO 标题'),
  localizedText('seoDescription', 'SEO 描述', 'textarea'),
]
function content(slug: ContentSlug, label: string, extra: Field[] = []): CollectionConfig {
  return {
    slug,
    labels: { singular: label, plural: label },
    admin: {
      group: '官网内容',
      useAsTitle: 'title',
      defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
      preview: (doc) =>
        `/api/preview?path=${encodeURIComponent(routeFor(slug, doc as { slug: string; line?: string }))}`,
    },
    access: {
      read: extra.includes(lineField) ? publishedOnSite : published,
      create: staff,
      update: staff,
      delete: admin,
    },
    versions: { drafts: true, maxPerDoc: 50 },
    hooks: {
      beforeChange: [
        async ({ data, req, originalDoc }) => {
          if (originalDoc?.id) await lock(req, `content:${slug}:${originalDoc.id}`)
          // Every locale is published together and must pass the release checks. Only trusted
          // scripts that check their own content (and test fixtures) set releaseApproved.
          if (data._status === 'published' && req.context.releaseApproved !== true)
            await assertPublishable(req, slug, originalDoc?.id, data)
          return data
        },
      ],
      afterChange: [
        async ({ doc, req }) => {
          if (!req.context.skipRevalidation) {
            try {
              const { revalidateTag } = await import('next/cache')
              revalidateTag('site-content', { expire: 0 })
            } catch {
              /* CLI execution has no Next cache. */
            }
          }
          return doc
        },
      ],
      afterDelete: [
        async () => {
          try {
            const { revalidateTag } = await import('next/cache')
            revalidateTag('site-content', { expire: 0 })
          } catch {}
        },
      ],
    },
    fields: [...contentFields, ...extra],
  }
}
export const Users: CollectionConfig = {
  slug: 'users',
  auth: { maxLoginAttempts: 5, lockTime: 600000 },
  labels: { singular: '管理员', plural: '管理员' },
  admin: { useAsTitle: 'email', group: '管理' },
  access: {
    create: admin,
    read: staff,
    update: ({ req }) =>
      req.user?.role === 'admin' ? true : req.user ? { id: { equals: req.user.id } } : false,
    delete: admin,
  },
  fields: [
    { name: 'name', type: 'text', label: '姓名' },
    {
      name: 'role',
      label: '角色',
      type: 'select',
      options: [
        { label: '管理员', value: 'admin' },
        { label: '内容编辑', value: 'editor' },
      ],
      defaultValue: 'editor',
      required: true,
      access: { update: admin },
      saveToJWT: true,
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create') {
          const count = await req.payload.count({ collection: 'users', overrideAccess: true, req })
          if (count.totalDocs === 0) data.role = 'admin'
        }
        return data
      },
    ],
  },
}
export const lineField: Field = {
  name: 'line',
  type: 'select',
  options: ['sealing', 'brushes', 'both'],
  defaultValue: siteLine,
  required: true,
  label: '产品线',
}
const imageField: Field = { name: 'image', type: 'upload', relationTo: 'media' }
const relations: Field[] = [
  { name: 'relatedProducts', type: 'relationship', relationTo: 'products', hasMany: true },
  { name: 'relatedGuides', type: 'relationship', relationTo: 'guides', hasMany: true },
  { name: 'relatedSolutions', type: 'relationship', relationTo: 'solutions', hasMany: true },
  { name: 'faqs', type: 'relationship', relationTo: 'faqs', hasMany: true },
]
export const Categories = content('categories', '产品分类', [
  lineField,
  imageField,
  { name: 'code', type: 'text', unique: true },
  { name: 'featured', type: 'checkbox' },
])
export const Solutions = content('solutions', '解决方案', [lineField, imageField, ...relations])
export const Cases = content('cases', '应用案例', [
  lineField,
  imageField,
  ...relations,
  { name: 'scenarioType', type: 'select', options: ['typical', 'real'], defaultValue: 'typical' },
  { name: 'customerName', type: 'text' },
])
export const Guides = content('guides', '采购指南', [
  lineField,
  imageField,
  ...relations,
  {
    name: 'topic',
    type: 'select',
    options: [
      'material-selection',
      'standards',
      'how-to-measure',
      'failure-modes',
      'rfq-checklist',
      'terminology',
    ],
  },
])
export const Faqs = content('faqs', '常见问题', [
  lineField,
  { name: 'relatedGuide', type: 'relationship', relationTo: 'guides' },
])
export const Materials = content('materials', '材料', [
  lineField,
  imageField,
  { name: 'family', type: 'select', options: ['elastomer', 'foam', 'filament', 'channel'] },
  { name: 'code', type: 'text', required: true, label: '材料代码' },
])
export const Applications = content('applications', '应用领域', [lineField, imageField, ...relations])
export const Pages = content('pages', '页面', [
  { name: 'heroImage', type: 'upload', relationTo: 'media', label: '主视觉' },
])
export const Products = content('products', '产品', [
  lineField,
  ...relations.filter((f) => 'name' in f && f.name !== 'relatedProducts'),
  {
    name: 'channelMaterial',
    type: 'select',
    hasMany: true,
    options: ['Galvanized steel', 'Stainless steel', 'Aluminium'],
  },
  { name: 'code', type: 'text', required: true, unique: true, label: '产品编号' },
  { name: 'category', type: 'relationship', relationTo: 'categories', label: '产品分类' },
  {
    name: 'materials',
    type: 'select',
    hasMany: true,
    options: [
      'NBR',
      'EPDM',
      'FKM',
      'Silicone',
      'CR',
      'EPDM sponge',
      'Silicone foam',
      'PU foam',
      'PVC/TPE carrier',
      'PA6',
      'PA66',
      'PA612',
      'PBT',
      'PP',
      'PEEK',
      'SS304',
      'SS316',
      'Abrasive nylon',
      'Conductive nylon',
    ],
    label: '材料选项',
  },
  { name: 'applications', type: 'relationship', relationTo: 'applications', hasMany: true, label: '应用' },
  { name: 'images', type: 'upload', relationTo: 'media', hasMany: true, label: '产品图片' },
  {
    name: 'specifications',
    type: 'array',
    label: '技术参数',
    fields: [
      { name: 'key', type: 'text', required: true, label: '参数标识' },
      localizedText('label', '参数名称'),
      { name: 'value', type: 'text', required: true, label: '数值或规格' },
      { name: 'unit', type: 'text', label: '单位' },
    ],
  },
])
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: '媒体', plural: '媒体' },
  admin: { group: '官网内容' },
  access: { read: () => true, create: staff, update: staff, delete: admin },
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    imageSizes: [
      { name: 'card', width: 640, height: 480, fit: 'inside', withoutEnlargement: true },
      { name: 'detail', width: 1440, height: 1080, fit: 'inside', withoutEnlargement: true },
    ],
    adminThumbnail: 'card',
    filesRequiredOnCreate: true,
  },
  fields: [
    localizedText('alt', '图片替代文本'),
    { name: 'illustrative', type: 'checkbox', defaultValue: false, label: '示意图' },
    { name: 'sourceNote', type: 'textarea', label: '素材来源 / 授权记录', access: { read: staff } },
    {
      name: 'approved',
      type: 'checkbox',
      defaultValue: false,
      label: '允许正式发布',
      access: { read: staff },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, originalDoc }) => {
        if (originalDoc?.id) await lock(req, `media:${originalDoc.id}`)
        return data
      },
    ],
    beforeOperation: [
      ({ args, operation, req }) => {
        if (operation === 'create' && req.file) {
          const ext = req.file.name.split('.').pop()?.toLowerCase()
          req.file.name = `${randomUUID()}.${ext}`
        }
        return args
      },
    ],
    beforeValidate: [
      ({ data, req, operation }) => {
        if (operation === 'update' && req.file)
          throw new Error('请上传为新图片后更换内容引用，保留历史版本。')
        if (req.file && req.file.size > 4 * 1024 * 1024) throw new Error('单张图片不可超过 4 MB。')
        return data
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        await lock(req, `media:${id}`)
        for (const [collection, field] of [
          ['products', 'images'],
          ['pages', 'heroImage'],
          ...(['categories', 'materials', 'applications', 'solutions', 'cases', 'guides'] as const).map(
            (c) => [c, 'image'] as const,
          ),
        ] as const) {
          const where = { [field]: { [field === 'images' ? 'contains' : 'equals']: id } }
          const current = await req.payload.find({
            collection,
            where,
            limit: 1,
            depth: 0,
            overrideAccess: true,
            req,
          })
          const versions = await req.payload.findVersions({
            collection,
            where: { [`version.${field}`]: { [field === 'images' ? 'contains' : 'equals']: id } },
            limit: 1,
            depth: 0,
            overrideAccess: true,
            req,
          })
          if (current.totalDocs || versions.totalDocs)
            throw new Error('图片仍被内容或历史版本引用，请先处理引用。')
        }
      },
    ],
  },
}
export const Inquiries: CollectionConfig = {
  slug: 'inquiries',
  labels: { singular: '询盘', plural: '询盘' },
  admin: {
    group: '客户联系',
    useAsTitle: 'email',
    defaultColumns: [
      'name',
      'company',
      'country',
      'line',
      'productSlug',
      'status',
      'notificationStatus',
      'autoReplyStatus',
      'createdAt',
    ],
  },
  access: { create: () => false, read: staff, update: staff, delete: admin },
  fields: [
    { name: 'submissionId', type: 'text', unique: true, required: true, admin: { readOnly: true } },
    ...['name', 'email', 'company', 'country', 'productSlug', 'locale', 'sourcePath'].map(
      (name) => ({ name, type: 'text', admin: { readOnly: true } }) as Field,
    ),
    { name: 'message', type: 'textarea', admin: { readOnly: true } },
    { name: 'line', type: 'select', options: ['sealing', 'brushes', 'both'], admin: { readOnly: true } },
    { name: 'safetyCritical', type: 'select', options: ['no', 'yes', 'unsure'], admin: { readOnly: true } },
    { name: 'rfq', type: 'json', admin: { readOnly: true } },
    {
      name: 'attribution',
      type: 'json',
      label: '访客来源（访客提供，非核实事实）',
      admin: {
        readOnly: true,
        description: '入口页面、外部来源域名和活动标签；用于询盘复盘，不代表已验证客户身份。',
      },
    },
    {
      name: 'attachments',
      type: 'array',
      admin: { readOnly: true },
      fields: [
        { name: 'key', type: 'text', required: true },
        { name: 'name', type: 'text', required: true },
        { name: 'size', type: 'number', required: true },
        { name: 'type', type: 'text' },
        { name: 'deletedAt', type: 'date' },
      ],
    },
    {
      name: 'attachmentLinks',
      type: 'ui',
      admin: { components: { Field: '/components/admin/AttachmentLinks#AttachmentLinks' } },
    },
    { name: 'consent', type: 'checkbox', admin: { readOnly: true } },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: '新询盘', value: 'new' },
        { label: '需技术审核', value: 'review' },
        { label: '跟进中', value: 'in-progress' },
        { label: '已关闭', value: 'closed' },
      ],
    },
    {
      name: 'notificationStatus',
      type: 'select',
      defaultValue: 'pending',
      options: ['pending', 'sent', 'failed', 'not-configured'],
      admin: { readOnly: true },
    },
    { name: 'notificationError', type: 'text', admin: { readOnly: true } },
    { name: 'notificationMessageId', type: 'text', label: '销售通知 Postmark ID', admin: { readOnly: true } },
    {
      // No default: enquiries received before the acknowledgement existed keep an empty value.
      name: 'autoReplyStatus',
      type: 'select',
      label: '客户自动确认邮件',
      options: [...autoReplyStatuses],
      admin: {
        readOnly: true,
        description:
          'sent 表示 Postmark 已接收（不等于已送达）；unknown 表示结果不明，请在 Postmark Activity 按询盘 ID 核对，不要重发；skipped 表示同一邮箱当日已达上限。',
      },
    },
    { name: 'autoReplyError', type: 'text', label: '自动确认邮件错误', admin: { readOnly: true } },
    { name: 'autoReplyMessageId', type: 'text', label: '自动确认 Postmark ID', admin: { readOnly: true } },
    { name: 'notes', type: 'textarea', label: '内部备注' },
    { name: 'retentionUntil', type: 'date', admin: { readOnly: true } },
  ],
}
export const Glossary: CollectionConfig = {
  slug: 'glossary',
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        await lock(req, 'glossary')
        return data
      },
    ],
    beforeDelete: [
      async ({ req }) => {
        await lock(req, 'glossary')
      },
    ],
  },
  labels: { singular: '术语', plural: '术语表' },
  admin: { group: '管理', useAsTitle: 'term' },
  access: { read: staff, create: staff, update: staff, delete: admin },
  fields: [
    { name: 'term', type: 'text', unique: true, required: true, label: '英文术语' },
    {
      name: 'translations',
      type: 'group',
      fields: locales.filter((l) => l !== 'en').map((l) => ({ name: l, type: 'text' })),
    },
    { name: 'protected', type: 'checkbox', defaultValue: false, label: '保留原文' },
    { name: 'note', type: 'textarea', label: '说明' },
  ],
}
export const RateLimits: CollectionConfig = {
  slug: 'rate-limits',
  admin: { hidden: true },
  access: { read: () => false, create: () => false, update: () => false, delete: () => false },
  fields: [
    { name: 'key', type: 'text', unique: true, required: true },
    { name: 'count', type: 'number', defaultValue: 0 },
    { name: 'expiresAt', type: 'date', required: true },
  ],
}

// Ledger for scripts/migration/import-target.ts: one row per imported source record,
// so a repeated import neither duplicates records nor overwrites later edits.
export const MigrationRecords: CollectionConfig = {
  slug: 'migration-records',
  labels: { singular: '迁移记录', plural: '迁移记录' },
  admin: {
    group: '管理',
    useAsTitle: 'sourceKey',
    defaultColumns: ['sourceKey', 'targetCollection', 'targetId', 'evidenceStatus', 'updatedAt'],
  },
  access: { read: staff, create: () => false, update: () => false, delete: () => false },
  fields: [
    { name: 'sourceKey', type: 'text', unique: true, required: true, admin: { readOnly: true } },
    { name: 'sourceCollection', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'sourceId', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'sourceSlug', type: 'text', admin: { readOnly: true } },
    { name: 'targetCollection', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'targetId', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'sourceHash', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'importedHash', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'runId', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'evidenceStatus', type: 'text', admin: { readOnly: true } },
    { name: 'evidence', type: 'json', admin: { readOnly: true } },
  ],
}
