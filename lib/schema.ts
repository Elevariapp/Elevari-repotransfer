import { z } from 'zod'

export const propertySchema = z.object({
  title: z.string().min(5, 'Title is too short'),
  description: z.string().min(400, 'Description must be at least 400 characters.'),
  price_per_night: z.number().positive('Price must be greater than zero'),
})

export type PropertyFormData = z.infer<typeof propertySchema>

