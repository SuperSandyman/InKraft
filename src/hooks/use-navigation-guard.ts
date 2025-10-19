'use client';

import { useEffect, useRef } from 'react';

const DEFAULT_MESSAGE = '変更内容が保存されていません。このまま移動しますか？';

/**
 * ブラウザ遷移やアプリ内リンクでページ離脱しようとした際に確認ダイアログを表示します。
 * App Routerではルーターイベントが提供されないため、アンカータグのクリックとpopstateをフックしています。
 */
export const useNavigationGuard = (shouldBlock: boolean, message: string = DEFAULT_MESSAGE) => {
    const shouldBlockRef = useRef(shouldBlock);
    const messageRef = useRef(message);
    const ignorePopStateRef = useRef(false);

    useEffect(() => {
        shouldBlockRef.current = shouldBlock;
    }, [shouldBlock]);

    useEffect(() => {
        messageRef.current = message;
    }, [message]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (!shouldBlockRef.current) return;
            event.preventDefault();
            event.returnValue = messageRef.current;
            return messageRef.current;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const confirmNavigation = () => window.confirm(messageRef.current);

        const handleLinkClick = (event: MouseEvent) => {
            if (!shouldBlockRef.current || event.defaultPrevented) return;
            const target = event.target as HTMLElement | null;
            const anchor = target?.closest('a[href]') as HTMLAnchorElement | null;
            if (!anchor) return;

            if (anchor.target && anchor.target !== '_self') return;
            if (anchor.hasAttribute('download')) return;

            const href = anchor.getAttribute('href');
            if (!href || href.startsWith('#')) return;

            const url = new URL(href, window.location.href);
            if (url.origin !== window.location.origin) return;

            if (!confirmNavigation()) {
                event.preventDefault();
                event.stopPropagation();
            }
        };

        const handlePopState = () => {
            if (ignorePopStateRef.current) {
                ignorePopStateRef.current = false;
                return;
            }
            if (!shouldBlockRef.current) return;
            if (!confirmNavigation()) {
                ignorePopStateRef.current = true;
                window.history.forward();
            }
        };

        window.addEventListener('click', handleLinkClick, true);
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('click', handleLinkClick, true);
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);
};
