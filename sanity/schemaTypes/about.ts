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
    { 
      name: 'story', 
      title: 'Our Story', 
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