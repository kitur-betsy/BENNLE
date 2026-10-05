export const Spinner = () => <div className="mx-auto my-16 size-6 animate-spin rounded-full border-2 border-line border-t-fg" />
export const ErrorState = ({ error }) => <p className="py-16 text-center text-sm text-danger">{error?.message || 'Something went wrong'}</p>
export const Empty = ({ children }) => <p className="py-16 text-center text-muted">{children}</p>
export const Skeleton = ({ className }) => <div className={`animate-pulse rounded-card bg-hover ${className}`} />
