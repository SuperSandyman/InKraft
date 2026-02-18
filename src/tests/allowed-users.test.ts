import { describe, expect, it } from 'vitest';

import { isUserAllowed, parseAllowedUsersEnv } from '@/lib/allowed-users';

describe('allowed users', () => {
    it('parses prefixed and plain entries', () => {
        const rules = parseAllowedUsersEnv('login:alice,email:alice@example.com,12345');
        expect(rules).toEqual([
            { field: 'login', value: 'alice' },
            { field: 'email', value: 'alice@example.com' },
            { field: 'any', value: '12345' }
        ]);
    });

    it('matches by github login', () => {
        const rules = parseAllowedUsersEnv('login:alice');
        const session = {
            user: {
                githubLogin: 'Alice',
                githubId: '999',
                email: 'alice@example.com'
            }
        } as Parameters<typeof isUserAllowed>[0];

        expect(isUserAllowed(session, rules)).toBe(true);
    });

    it('matches plain rule against github id', () => {
        const rules = parseAllowedUsersEnv('12345');
        const session = {
            user: {
                githubLogin: 'bob',
                githubId: '12345',
                email: 'bob@example.com',
                name: 'Bob'
            }
        } as Parameters<typeof isUserAllowed>[0];

        expect(isUserAllowed(session, rules)).toBe(true);
    });

    it('matches plain rule against display name for backward compatibility', () => {
        const rules = parseAllowedUsersEnv('Sandyman');
        const session = {
            user: {
                githubLogin: 'sandyman-dev',
                githubId: '12345',
                email: 'sandyman@example.com',
                name: 'Sandyman'
            }
        } as Parameters<typeof isUserAllowed>[0];

        expect(isUserAllowed(session, rules)).toBe(true);
    });

    it('rejects when rules are empty', () => {
        const session = {
            user: {
                githubLogin: 'bob',
                githubId: '12345',
                email: 'bob@example.com'
            }
        } as Parameters<typeof isUserAllowed>[0];

        expect(isUserAllowed(session, [])).toBe(false);
    });
});
