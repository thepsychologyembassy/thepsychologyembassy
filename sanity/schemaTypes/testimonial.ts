import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list';
export default {
  name: 'testimonial',
  title: 'Testimonials',
  type: 'document',
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: 'testimonial' }),
    { 
      name: 'name', 
      title: 'Patient / Client Name', 
      type: 'string',
      validation: (Rule: any) => Rule.required()
    },
    { 
      name: 'quote', 
      title: 'Their Testimonial', 
      type: 'text',
      validation: (Rule: any) => Rule.required()
    },
    { 
      name: 'image', 
      title: 'Profile Picture', 
      type: 'image', 
      options: { hotspot: true },
      description: 'Optional: Upload a picture of the client.'
    }
  ]
}