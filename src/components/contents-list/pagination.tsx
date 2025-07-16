import Link from 'next/link';

interface PaginationProps {
    totalPages: number;
    currentPage: number;
    status: string;
}

const Pagination = ({ totalPages, currentPage, status }: PaginationProps) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-center gap-2 mt-6">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Link
                    key={page}
                    href={{
                        pathname: '/contents',
                        query: status === 'all' ? { page } : { page, status }
                    }}
                    className={`px-3 py-1 rounded-md border text-sm font-medium transition-colors ${
                        currentPage === page
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-muted hover:bg-muted'
                    }`}
                >
                    {page}
                </Link>
            ))}
        </div>
    );
};

export default Pagination;
