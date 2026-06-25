import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list';
export default {
  name: 'initiative',
  title: 'Initiatives',
  type: 'document',
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: 'initiative' }),
    { name: 'title', title: 'Initiative Name (e.g., Project SARTHI)', type: 'string' },
    { name: 'subtitle', title: 'Subtitle', type: 'string' },
    { name: 'logo', title: 'Logo', type: 'image' },
    { 
      name: 'body', 
      title: 'The Story / Narrative', 
      type: 'array', 
      of: [{ type: 'block' }],
      description: 'Use the quote button (") in the editor to create the large italic highlight text.'
    },
    { name: 'vision', title: 'Our Vision', type: 'text' },
    { name: 'mission', title: 'Our Mission Points', type: 'array', of: [{ type: 'string' }] },
    { name: 'offerings', title: 'What it Offers', type: 'array', of: [{ type: 'string' }] },
    { name: 'quote', title: 'Ending Quote', type: 'string' },
  ],
}