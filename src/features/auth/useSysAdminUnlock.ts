/** @format */

import { useEffect, useState } from 'react';

/** Handles the hidden F8-only SysAdmin unlock gesture on login. */
export const useSysAdminUnlock = () => {
    const [isUnlocked, setIsUnlocked] = useState(false);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'F8') return;

            event.preventDefault();
            setIsUnlocked(true);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return { isUnlocked, setIsUnlocked } as const;
};
