export default {
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    {
      name: 'adminEmails',
      title: 'Authorized Admin Emails',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Any email listed here will have full access to the secure Admin Dashboard.'
    }
  ]
}