import { site } from '../config/site'

// Default site settings. The admin can override these; the API layer persists the overrides.
export const settingsDefaults = {
  name: site.name,
  tagline: site.tagline,
  description: site.description,
  announcements: site.announcements,
  freeShippingThreshold: site.freeShippingThreshold,
  shippingFlat: site.shippingFlat,
  contact: site.contact,
}
