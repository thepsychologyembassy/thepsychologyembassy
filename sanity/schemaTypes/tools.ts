import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list';

export default {
  name: 'tool',
  title: 'Tests & Tools',
  type: 'document',
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: 'tool' }),
    { name: 'title', title: 'Title', type: 'string', validation: (Rule: any) => Rule.required() },
    { 
      name: 'slug', 
      title: 'URL Slug', 
      type: 'slug', 
      options: { source: 'title', maxLength: 96 }, 
      validation: (Rule: any) => Rule.required(),
      description: 'Click generate to create a unique URL for this tool.'
    },
    {
      name: 'isComingSoon',
      title: 'Is Coming Soon?',
      type: 'boolean',
      description: 'Turn this on to show a Coming Soon badge and disable the link on the website.',
      initialValue: false,
    },
    { 
      name: 'shortDescription', 
      title: 'Short Description (For the Card)', 
      type: 'text',
      description: 'Keep this brief (2-3 sentences) for the main tools list.'
    },
    { 
      name: 'detailedContent', 
      title: 'Detailed Explanation (For the Inner Page)', 
      type: 'array', 
      of: [{ type: 'block' }],
      description: 'The full explanation, instructions, and theory behind the tool.'
    },
    { name: 'category', title: 'Category', type: 'string', description: 'e.g., Assessment, Journaling' },
    { name: 'time', title: 'Time Required', type: 'string', description: 'e.g., 5 Mins, Daily' },
    { 
      name: 'pdfFile', 
      title: 'Upload PDF (Optional)', 
      type: 'file', 
      options: { accept: '.pdf' },
      description: 'Upload a downloadable worksheet or test here.'
    },
    { name: 'link', title: 'External Link (Optional)', type: 'url', description: 'Link to a Google Form or external site.' }
  ]
}