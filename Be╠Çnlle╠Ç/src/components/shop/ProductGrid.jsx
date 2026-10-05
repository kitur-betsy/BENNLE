import ProductCard from './ProductCard'
import { Skeleton, ErrorState, Empty } from '../ui/States'

const cols = {
  default: 'grid gap-8 md:grid-cols-2 xl:grid-cols-3',
  dense: 'grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4',
}

export default function ProductGrid({ state: { data, loading, error }, empty = 'No products found.', dense = false }) {
  const cls = dense ? cols.dense : cols.default
  if (error) return <ErrorState error={error} />
  if (loading) return <div className={cls}>{[0, 1, 2, 3].map((i) => <Skeleton key={i} className={dense ? 'h-72' : 'h-[28rem]'} />)}</div>
  if (!data.length) return <Empty>{empty}</Empty>
  return <div className={cls}>{data.map((p, i) => <ProductCard key={p.id} product={p} index={i % 3} dense={dense} />)}</div>
}
