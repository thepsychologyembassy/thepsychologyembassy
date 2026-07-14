import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list';
export default {
  name: 'internship',
  title: 'Internships',
  type: 'document',
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: 'internship' }),
    {
      name: 'title',
      title: 'Internship Title',
      type: 'string',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      options: { source: 'title' },
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
      name: 'duration',
      title: 'Duration',
      type: 'string',
      description: 'e.g., "3 Months", "6 Weeks"'
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text'
    },
    // ---- INVENTORY & PRICING FIELDS ----
    {
      name: 'price',
      title: 'Enrollment Fee (in ₹)',
      type: 'number',
      description: 'Enter the cost of this program. Enter 0 if it is free.',
      validation: (Rule: any) => Rule.required().min(0)
    },
    {
      name: 'totalPositions',
      title: 'Total Available Seats',
      type: 'number',
      description: 'The maximum number of students allowed before the waitlist triggers.',
      validation: (Rule: any) => Rule.required().min(1)
    },
    {
      name: 'isActive',
      title: 'Accepting Applications?',
      type: 'boolean',
      initialValue: true,
      description: 'Turn this off to completely close applications.'
    }
  ]
}