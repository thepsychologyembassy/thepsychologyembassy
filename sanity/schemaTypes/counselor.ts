import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list';
export default {
  name: 'counselor',
  title: 'Counselor',
  type: 'document',
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: 'counselor' }),
    { 
      name: 'name', 
      title: 'Name', 
      type: 'string', 
      validation: (Rule: any) => Rule.required() 
    },
    { 
      name: 'image', 
      title: 'Profile Photo', 
      type: 'image', 
      options: { hotspot: true } 
    },
    { 
      name: 'designation', 
      title: 'Designation', 
      type: 'string',
      validation: (Rule: any) => Rule.required() 
    },
    { 
      name: 'experience', 
      title: 'Years of Experience', 
      type: 'string',
      description: 'e.g., "5+ Years"'
    },
    { 
      name: 'sessionsCompleted', 
      title: 'Sessions Completed', 
      type: 'string', 
      description: 'e.g., "500+" or "1,200+"' 
    },
    { 
      name: 'education', 
      title: 'Educational Qualifications', 
      type: 'string' 
    },
    { 
      name: 'languages', 
      title: 'Languages Spoken', 
      type: 'string',
      description: 'e.g., English, Hindi'
    },
    { 
      name: 'bio', 
      title: 'About the Counselor', 
      type: 'text' 
    },
    // ---- BOOKING ENGINE LOGIC FIELDS ----
    { 
      name: 'fees', 
      title: 'Fees per Session (₹)', 
      type: 'number', // Must be a number for checkout math!
      description: 'Enter just the number (e.g., 1500). The checkout system will use this to calculate the total price.',
      validation: (Rule: any) => Rule.required().min(0)
    },
    {
      name: 'email',
      title: 'Counselor Login Email',
      type: 'string',
    },
    { 
      name: 'mode', 
      title: 'Mode of Consultation', 
      type: 'string', 
      options: {
        list: [
          { title: 'Online Only', value: 'online' },
          { title: 'In-Person Only', value: 'in-person' },
          { title: 'Both (Online & In-Person)', value: 'both' }
        ],
        layout: 'radio'
      },
      initialValue: 'online',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'shiftStart',
      title: 'Shift Start Hour (24hr format)',
      type: 'number',
      description: 'e.g., 10 for 10:00 AM, 14 for 2:00 PM. (Default is 12)',
      initialValue: 12
    },
    {
      name: 'shiftEnd',
      title: 'Shift End Hour (24hr format)',
      type: 'number',
      description: 'e.g., 18 for 6:00 PM, 20 for 8:00 PM. (Default is 20)',
      initialValue: 20
    },
    {
      name: 'blockedDates',
      title: 'Unavailable Dates (Days Off)',
      type: 'array',
      of: [{ type: 'date' }],
      description: 'Select dates this counselor is unavailable. The system will block users from booking them on these days.'
    },
    {
      name: 'clinicAddress',
      title: 'Clinic / Office Address',
      type: 'text',
      description: 'If they offer in-person sessions, provide the full address. This will be securely emailed to the patient before their appointment.',
      // This magically hides the address box if they only do online sessions!
      hidden: ({ document }: any) => document?.mode === 'online'
    }
  ],

}