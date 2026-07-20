export default {
  name: 'about',
  title: 'About Page',
  type: 'document',
  fields: [
    {
       name: 'title',
       title: 'Page Title',
       type: 'string',
       initialValue: 'About Us'
     },
    {
       name: 'subtitle',
       title: 'Subtitle',
       type: 'text',
      description: 'A short, impactful sentence below the main title.'
    },
    {
       name: 'mainImage',
       title: 'Main Story Image',
       type: 'image',
       options: { hotspot: true }
     },
     // --- NEW FOUNDER FIELDS ---
    {
       name: 'founderName',
       title: 'Founder Name',
       type: 'string'
    },
    {
       name: 'founderImage',
       title: 'Founder Photo',
       type: 'image',
       options: { hotspot: true }
    },
    {
       name: 'founderBio',
       title: 'Founder Bio',
       type: 'array',
       of: [{ type: 'block' }]
    },
    // --------------------------
    {
       name: 'story',
       title: 'Where It All Began',
       type: 'array',
       of: [{ type: 'block' }],
      description: 'The narrative of how Psychology Embassy started.'
    },
    {
       name: 'mission',
       title: 'Our Mission',
       type: 'text'
     },
    {
       name: 'vision',
       title: 'Our Vision',
       type: 'text'
     },
    {
      name: 'coreValues',
      title: 'Core Values',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', title: 'Value Title (e.g., Empathy)', type: 'string' },
            { name: 'description', title: 'Short Description', type: 'text' }
          ]
        }
      ]
    }
  ]
}