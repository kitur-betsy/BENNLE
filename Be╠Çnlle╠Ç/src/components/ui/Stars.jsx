import { Star } from 'lucide-react'
import { cn } from '../../lib/format'

export default function Stars({ rating, reviews, className }) {
  return (
    <div className={cn('flex items-center gap-1 text-star', className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn('size-4', n <= Math.floor(rating) ? 'fill-current' : 'opacity-40')} />
      ))}
      {reviews != null && <span className="ml-2 text-sm font-medium text-muted">{reviews} reviews</span>}
    </div>
  )
}
