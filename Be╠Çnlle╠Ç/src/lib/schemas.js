import { z } from 'zod'

export const checkoutSchema = z.object({
  name: z.string().min(2, 'Required'),
  email: z.string().email('Enter a valid email'),
  address: z.string().min(5, 'Required'),
  city: z.string().min(2, 'Required'),
  zip: z.string().min(3, 'Required'),
  country: z.string().min(2, 'Required'),
})
export const productSchema = z.object({
  name: z.string().min(2, 'Required'),
  subtitle: z.string().min(2, 'Required'),
  category: z.string().min(1, 'Required'),
  price: z.coerce.number().positive('Must be positive'),
  stock: z.coerce.number().int().min(0, 'Cannot be negative'),
  status: z.enum(['active', 'draft']),
  image: z.string().optional(),
})
export const contactSchema = z.object({
  name: z.string().min(2, 'Enter your name'),
  email: z.string().email('Enter a valid email'),
  message: z.string().min(10, 'Tell us a little more (10+ characters)'),
})
export const newsletterSchema = z.object({ email: z.string().email('Enter a valid email') })
