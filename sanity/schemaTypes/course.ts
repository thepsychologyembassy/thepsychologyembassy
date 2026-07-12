import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list';
export const course = {
  name: 'course',
  title: 'Course / Internship',
  type: 'document',
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: 'course' }),
    {
      name: 'title',
      title: 'Program Title',
      type: 'string',
    },
    {
      name: 'provider',
      title: 'Provider Type',
      type: 'string',
      description: 'Is this an internal Psychology Embassy program or an external opportunity?',
      options: {
        list: [
          { title: 'Internal', value: 'Internal' },
          { title: 'External', value: 'External' }
        ],
        layout: 'radio' // This turns it into easy-to-click radio buttons
      },
      initialValue: 'Internal' // Defaults to Internal so your client saves time
    },
    {
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      options: { source: 'title' },
    },
    {
      name: 'isComingSoon',
      title: 'Is Coming Soon?',
      type: 'boolean',
      description: 'Turn this on to show a Coming Soon badge and disable the link on the website.',
      initialValue: false,
    },
    {
      name: 'price',
      title: 'Enrollment Fee (in ₹)',
      type: 'number',
      description: 'Enter the cost of this program. Enter 0 if it is free.',
      // FIX: Add (Rule: any) here
      validation: (Rule: any) => Rule.required().min(0) 
    },
    {
      name: 'totalPositions',
      title: 'Total Available Seats',
      type: 'number',
      description: 'The maximum number of students allowed before the waitlist triggers.',
      // FIX: Add (Rule: any) here
      validation: (Rule: any) => Rule.required().min(1) 
    },
    {
      name: 'isActive',
      title: 'Accepting Applications?',
      type: 'boolean',
      initialValue: true,
      description: 'Turn this off to completely close applications for this program.'
    },
    {
      name: 'status',
      title: 'Enrollment Status',
      type: 'string',
      description: 'Note: To show "Coming Soon" on the website, use the "Is Coming Soon?" toggle above — this field is just for your internal tracking.',
      options: {
        list: ['Open for Enrollment', 'Waitlist', 'Closed'],
      },
      initialValue: 'Open for Enrollment',
    },
    {
      name: 'externalLink',
      title: 'External Application URL',
      type: 'url',
      hidden: ({ document }: any) => document?.provider !== 'External',
      description: 'If this is an external program, paste the link to their application page here.',
    },
    {
      name: 'customQuestions',
      title: 'Application Questions',
      type: 'array',
      of: [{ type: 'string' }],
      hidden: ({ document }: any) => document?.provider === 'External',
      description: 'Add specific questions you want applicants to answer (e.g., "Why do you want this internship?", "What are your research interests?").',
    },
    {
      name: 'image',
      title: 'Thumbnail Image',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'description',
      title: 'Short Description',
      type: 'text',
    },
    {
      name: 'content',
      title: 'Detailed Program Information',
      type: 'array',
      of: [{ type: 'block' }],
    },
  ],
}