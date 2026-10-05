import { images } from './images'

export const categories = [
  { id: 'cleansers', label: 'Cleansers' },
  { id: 'serums', label: 'Serums' },
  { id: 'moisturizers', label: 'Moisturizers' },
  { id: 'oils', label: 'Oils' },
]

export const products = [
  { id: 'p1', featured: true, slug: 'barrier-repair-serum', name: 'Barrier Repair Serum', subtitle: 'Ceramides + Niacinamide 5%', category: 'serums', price: 5418, badge: 'New', rating: 4.5, reviews: 162, stock: 48, image: images.serum, gallery: [images.serum, images.lifestyle1, images.lifestyle2], status: 'active',
    description: 'A lightweight serum that restores the skin barrier with ceramides and 5% niacinamide. Calms redness and visibly improves texture in two weeks.',
    ingredients: ['Ceramide NP', 'Niacinamide 5%', 'Panthenol', 'Squalane'], size: '30 ml' },
  { id: 'p2', featured: true, slug: 'cloud-cleanser', name: 'Cloud Cleanser', subtitle: 'Amino Acid Gel', category: 'cleansers', price: 2838, badge: 'pH 5.5', rating: 4.8, reviews: 311, stock: 120, image: images.cleanser, gallery: [images.cleanser, images.cleanse, images.lifestyle2], status: 'active',
    description: 'A pH-balanced gel cleanser that lifts impurities without stripping. Leaves skin soft, never tight.',
    ingredients: ['Coco-glucoside', 'Glycerin', 'Aloe vera', 'Green tea'], size: '150 ml' },
  { id: 'p3', slug: 'dew-moisture-cream', name: 'Dew Moisture Cream', subtitle: 'Ceramide-rich hydration', category: 'moisturizers', price: 4902, rating: 4.6, reviews: 204, stock: 64, image: images.cream, gallery: [images.cream, images.nourish, images.lifestyle2], status: 'active',
    description: 'A cushiony daily moisturizer with ceramides and hyaluronic acid for all-day barrier-supporting hydration.',
    ingredients: ['Ceramide AP', 'Hyaluronic acid', 'Shea butter', 'Oat extract'], size: '50 ml' },
  { id: 'p4', featured: true, slug: 'radiance-treatment-serum', name: 'Radiance Treatment Serum', subtitle: 'Vitamin C + Botanical Blend', category: 'serums', price: 6966, badge: 'Bestseller', rating: 4.7, reviews: 428, stock: 9, image: images.radiance, gallery: [images.radiance, images.lifestyle2, images.lifestyle2], status: 'active',
    description: 'A stabilised vitamin C serum with botanical extracts to brighten dullness and even tone.',
    ingredients: ['Ascorbyl glucoside', 'Rosehip', 'Ferulic acid', 'Licorice root'], size: '30 ml' },
  { id: 'p5', slug: 'hydra-restore-essence', name: 'Hydra Restore Essence', subtitle: 'Hyaluronic acid + Aloe', category: 'serums', price: 3741, rating: 4.4, reviews: 97, stock: 80, image: images.essence, gallery: [images.essence, images.hydrate, images.lifestyle2], status: 'active',
    description: 'A weightless essence that floods skin with multi-weight hyaluronic acid.',
    ingredients: ['Hyaluronic acid', 'Aloe vera', 'Betaine', 'Cucumber extract'], size: '100 ml' },
  { id: 'p6', slug: 'botanical-face-oil', name: 'Botanical Face Oil', subtitle: 'Jojoba + Rosehip + Bakuchiol', category: 'oils', price: 5934, badge: 'New', rating: 4.9, reviews: 76, stock: 0, image: images.oil, gallery: [images.oil, images.lifestyle1, images.lifestyle2], status: 'active',
    description: 'A silky blend of cold-pressed oils with bakuchiol, a gentle plant alternative to retinol.',
    ingredients: ['Jojoba oil', 'Rosehip oil', 'Bakuchiol', 'Vitamin E'], size: '30 ml' },
  { id: 'p7', slug: 'renewal-night-cream', name: 'Renewal Night Cream', subtitle: 'Peptides + Botanical support', category: 'moisturizers', price: 7482, rating: 4.5, reviews: 133, stock: 31, image: images.night, gallery: [images.night, images.nourish, images.lifestyle2], status: 'draft',
    description: 'An overnight cream with peptides that supports skin renewal while you sleep.',
    ingredients: ['Peptide complex', 'Squalane', 'Chamomile', 'Shea butter'], size: '50 ml' },
]
