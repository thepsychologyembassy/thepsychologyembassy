import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list';
export const blog = {
  name: 'blog',
  title: 'Blog Post',
  type: 'document',
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: 'blog' }),
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      description: 'Click "Generate" to automatically create a URL based on the title.',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    },
    {
      name: 'mainImage',
      title: 'Main Image',
      type: 'image',
      options: {
        hotspot: true, // Allows your client to crop the image inside the dashboard
      },
    },
    {
      name: 'excerpt',
      title: 'Short Excerpt',
      type: 'text',
      description: 'A 1-2 sentence summary that will appear on the main blogs page.',
    },
    {
      name: 'body',
      title: 'Blog Content',
      type: 'array', // This creates the rich-text editor (like MS Word)
      of: [{ type: 'block' }],
    },
  ],
}