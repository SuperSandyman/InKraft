'use client';

import * as React from 'react';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from '@/components/ui/breadcrumb';

export interface CrumbItem {
    label: string;
    href?: string;
    isCurrent?: boolean;
}

interface BreadcrumbsProps {
    items: CrumbItem[];
    className?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className }) => {
    const lastIndex = items.length - 1;
    return (
        <Breadcrumb className={className}>
            <BreadcrumbList>
                {items.map((item, idx) => {
                    const isCurrent = item.isCurrent ?? (idx === lastIndex && !item.href);
                    return (
                        <React.Fragment key={`${item.label}-${idx}`}>
                            <BreadcrumbItem>
                                {isCurrent ? (
                                    <BreadcrumbPage aria-current="page">{item.label}</BreadcrumbPage>
                                ) : item.href ? (
                                    <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                                ) : (
                                    <BreadcrumbPage aria-current="page">{item.label}</BreadcrumbPage>
                                )}
                            </BreadcrumbItem>
                            {idx < lastIndex && <BreadcrumbSeparator />}
                        </React.Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
};

export default Breadcrumbs;
