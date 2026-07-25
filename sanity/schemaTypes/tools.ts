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
    { name: 'link', title: 'External Link (Optional)', type: 'url', description: 'Link to a Google Form or external site.' },

    // ─── Scored assessment toggle ───────────────────────────────────────
    {
      name: 'isAssessment',
      title: 'This is a scored test (e.g. Personality Test, ADHD Screener)',
      type: 'boolean',
      initialValue: false,
      description: 'Turn ON only for question-and-score type tests. This reveals the fields below to build the quiz, scoring, and result ranges. Leave OFF for plain articles/worksheets/links.',
    },
    {
      name: 'assessmentDisclaimer',
      title: 'Disclaimer shown before & after the test',
      type: 'text',
      hidden: ({ parent }: any) => !parent?.isAssessment,
      description: 'Shown to the client before they start, and again with their result.',
      initialValue:
        'This self-assessment is a screening and self-reflection tool only. It is not a psychological test and does not provide a medical or clinical diagnosis. Only a licensed mental health professional can diagnose a condition, based on a full clinical evaluation. If your results concern you, or you are in distress, please consider booking a session with one of our counsellors.',
      validation: (Rule: any) =>
        Rule.custom((val: string, ctx: any) =>
          ctx.parent?.isAssessment && !val ? 'A disclaimer is required for scored tests.' : true
        ),
    },
    {
      name: 'questions',
      title: 'Questions',
      type: 'array',
      hidden: ({ parent }: any) => !parent?.isAssessment,
      description: 'The questions a client answers, in order.',
      of: [
        {
          type: 'object',
          name: 'question',
          fields: [
            { name: 'questionText', title: 'Question', type: 'text', validation: (Rule: any) => Rule.required() },
            { name: 'helpText', title: 'Helper text (optional)', type: 'string', description: 'Optional clarifying note shown under the question.' },
            {
              name: 'options',
              title: 'Answer options',
              type: 'array',
              description: 'The choices a client can pick for this question, each with a score value.',
              validation: (Rule: any) => Rule.min(2).error('Add at least 2 options.'),
              of: [
                {
                  type: 'object',
                  name: 'option',
                  fields: [
                    { name: 'label', title: 'Label (shown to client)', type: 'string', validation: (Rule: any) => Rule.required() },
                    { name: 'value', title: 'Score value / weight', type: 'number', description: 'Numeric weight added to the total when this option is chosen.', validation: (Rule: any) => Rule.required() },
                  ],
                  preview: { select: { title: 'label', subtitle: 'value' } },
                },
              ],
            },
          ],
          preview: {
            select: { title: 'questionText' },
          },
        },
      ],
      validation: (Rule: any) =>
        Rule.custom((val: any[], ctx: any) =>
          ctx.parent?.isAssessment && (!val || val.length === 0)
            ? 'Add at least one question for a scored test.'
            : true
        ),
    },
    {
      name: 'resultRanges',
      title: 'Result Ranges',
      type: 'array',
      description: 'Define score bands (e.g. 0–5 = "Low indicators", 6–12 = "Some indicators", 13+ = "Significant indicators"). Ranges should be inclusive and non-overlapping. Never use disorder names as a verdict — describe indicators, not diagnoses.',
      hidden: ({ parent }: any) => !parent?.isAssessment,
      of: [
        {
          type: 'object',
          name: 'resultRange',
          fields: [
            { name: 'minScore', title: 'Minimum score (inclusive)', type: 'number', validation: (Rule: any) => Rule.required() },
            { name: 'maxScore', title: 'Maximum score (inclusive)', type: 'number', validation: (Rule: any) => Rule.required() },
            { name: 'rangeLabel', title: 'Range label (e.g. "Mild indicators")', type: 'string', validation: (Rule: any) => Rule.required() },
            {
              name: 'resultDescription',
              title: 'Result description shown to client',
              type: 'text',
              description: 'Careful, non-diagnostic language. Avoid stating the person "has" a condition — describe patterns/indicators only.',
              validation: (Rule: any) => Rule.required(),
            },
            { name: 'showBookingCTA', title: 'Show "Book a Session" button?', type: 'boolean', initialValue: true, description: 'Recommended ON for every range, since only a professional session can offer real clarity.' },
            { name: 'ctaText', title: 'Custom CTA button text (optional)', type: 'string', initialValue: 'Talk to a Counsellor' },
          ],
          preview: {
            select: { title: 'rangeLabel', min: 'minScore', max: 'maxScore' },
            prepare: ({ title, min, max }: any) => ({ title, subtitle: `Score ${min}–${max}` }),
          },
        },
      ],
      validation: (Rule: any) =>
        Rule.custom((val: any[], ctx: any) =>
          ctx.parent?.isAssessment && (!val || val.length === 0)
            ? 'Add at least one result range for a scored test.'
            : true
        ),
    },
  ]
}