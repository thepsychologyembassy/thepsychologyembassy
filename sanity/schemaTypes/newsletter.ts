import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list';

export const newsletter = {
  name: 'newsletter',
  title: 'Newsletter',
  type: 'document',
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: 'newsletter' }),
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'e.g. "October 2026 Newsletter"',
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
      name: 'isComingSoon',
      title: 'Is Coming Soon?',
      type: 'boolean',
      description: 'Turn this on to show a Coming Soon badge and disable the link on the website.',
      initialValue: false,
    },
    {
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    },
    {
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      description: 'Shown on the newsletter listing card. If left empty, the first page of the PDF is used instead.',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'excerpt',
      title: 'Short Excerpt',
      type: 'text',
      description: 'A 1-2 sentence summary that will appear on the newsletters listing page.',
    },
    {
      name: 'pdfFile',
      title: 'Upload Newsletter PDF',
      type: 'file',
      options: { accept: '.pdf' },
      description: 'Upload the newsletter as a PDF. It will be displayed as a flip-through reader on the site, with a download button.',
      validation: (Rule: any) => Rule.required(),
    },
  ],
  preview: {
    select: { title: 'title', subtitle: 'publishedAt', media: 'coverImage' },
  },
};
