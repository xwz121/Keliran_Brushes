import type { GlobalConfig } from 'payload'
import { normalizeWhatsAppNumber } from '../lib/whatsapp'
const social = (value: unknown, hosts: string[]) => {
  if (!value) return true
  try {
    const u = new URL(String(value))
    return (u.protocol === 'https:' && hosts.includes(u.hostname)) || 'Use the official HTTPS profile URL.'
  } catch {
    return 'Enter a valid URL.'
  }
}
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: '站点设置',
  access: { read: () => true, update: ({ req }) => req.user?.role === 'admin' },
  hooks: {
    afterChange: [
      async () => {
        try {
          const { revalidateTag } = await import('next/cache')
          revalidateTag('site-settings', { expire: 0 })
        } catch {}
      },
    ],
  },
  fields: [
    ...[
      'legalEntity',
      'registrationNo',
      'vatNo',
      'addressCountry',
      'phone',
      'phoneSecondary',
      'hours',
      'secondaryLegalEntity',
      'secondaryRegistrationNo',
      'secondaryAddressCountry',
      'registrationJurisdiction',
      'secondaryRegistrationJurisdiction',
    ].map((name) => ({
      name,
      type: 'text' as const,
    })),
    { name: 'addressLines', type: 'textarea' },
    { name: 'secondaryAddressLines', type: 'textarea' },
    { name: 'publicEmail', type: 'email' },
    {
      name: 'whatsappNumber',
      type: 'text',
      validate: (v: unknown) =>
        !v || normalizeWhatsAppNumber(String(v))
          ? true
          : 'Use an international number including country code.',
      hooks: { beforeValidate: [({ value }) => (value ? normalizeWhatsAppNumber(value) || value : '')] },
    },
    {
      name: 'whatsappNumberSecondary',
      type: 'text',
      validate: (v: unknown) =>
        !v || normalizeWhatsAppNumber(String(v))
          ? true
          : 'Use an international number including country code.',
      hooks: { beforeValidate: [({ value }) => (value ? normalizeWhatsAppNumber(value) || value : '')] },
    },
    { name: 'whatsappEnabled', type: 'checkbox', defaultValue: false },
    { name: 'whatsappFloating', type: 'checkbox', defaultValue: true },
    {
      name: 'facebookUrl',
      type: 'text',
      validate: (v: unknown) => social(v, ['facebook.com', 'www.facebook.com']),
    },
    {
      name: 'linkedinUrl',
      type: 'text',
      validate: (v: unknown) => social(v, ['linkedin.com', 'www.linkedin.com']),
    },
    { name: 'internalNotes', type: 'textarea', access: { read: ({ req }) => Boolean(req.user) } },
  ],
}
