import type {StructureResolver} from 'sanity/structure'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Content')
    .items([
      // 1. The custom drag-and-drop schemas
      orderableDocumentListDeskItem({ type: 'counselor', title: 'Counselors', S, context }),
      orderableDocumentListDeskItem({ type: 'course', title: 'Courses', S, context }),
      orderableDocumentListDeskItem({ type: 'internship', title: 'Internships', S, context }),
      orderableDocumentListDeskItem({ type: 'tool', title: 'Tests & Tools', S, context }), 
      orderableDocumentListDeskItem({ type: 'blog', title: 'Blog Posts', S, context }),
      orderableDocumentListDeskItem({ type: 'initiative', title: 'Initiatives', S, context }),
      orderableDocumentListDeskItem({ type: 'testimonial', title: 'Testimonials', S, context }),

      S.divider(), // A visual line separating draggable content from fixed content

      // 2. Site Settings as a true singleton — always opens/edits the one
      // document with this fixed ID, never lets you create a duplicate.
      S.listItem()
        .title('Site Settings')
        .id('siteSettings')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
        ),

      // 3. Automatically list everything else normally
      ...S.documentTypeListItems().filter(
        (listItem) => !['counselor', 'course', 'internship', 'tool', 'blog', 'initiative', 'testimonial', 'siteSettings'].includes(listItem.getId() as string)
      ),
    ])