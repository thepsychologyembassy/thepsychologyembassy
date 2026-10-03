import { type SchemaTypeDefinition } from 'sanity'
import { blog } from './blog'
import { newsletter } from './newsletter'
import { course } from './course'
import internship from './internship'
import  counselor  from './counselor'
import  testimonial  from './testimonial'
import  initiative  from './initiative'
import tool from './tools' 
import settings from './settings'
import  about  from './about'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [blog, newsletter, course, counselor, testimonial, initiative, about, tool, internship, settings],
}