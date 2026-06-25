import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list';
export default {
  name: 'tool',
  title: 'Tests & Tools',
  type: 'document',
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: 'tool' }),
    { name: 'title', title: 'Title', type: 'string', validation: (Rule: any) => Rule.required() },
    { name: 'description', title: 'Description', type: 'text' },
    { name: 'category', title: 'Category', type: 'string', description: 'e.g., Assessment, Downloadable Tool' },
    { name: 'time', title: 'Time Required', type: 'string', description: 'e.g., 5 Mins, Daily' },
    { name: 'link', title: 'External Link', type: 'url', description: 'Link to Google Form, Typeform, or PDF' }
  ]
}