import type { Session } from 'next-auth';

type AllowedUserField = 'any' | 'id' | 'login' | 'email' | 'name';

interface AllowedUserRule {
    field: AllowedUserField;
    value: string;
}

const normalize = (value: string | null | undefined): string => value?.trim().toLowerCase() ?? '';

export const parseAllowedUsersEnv = (raw: string): AllowedUserRule[] => {
    return raw
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map<AllowedUserRule>((entry) => {
            const separatorIndex = entry.indexOf(':');
            if (separatorIndex <= 0) {
                return { field: 'any', value: normalize(entry) };
            }

            const field = entry.slice(0, separatorIndex).trim().toLowerCase();
            const value = normalize(entry.slice(separatorIndex + 1));

            if (!value) {
                return { field: 'any', value: '' };
            }

            let normalizedField: AllowedUserField = 'any';
            if (field === 'id' || field === 'login' || field === 'email' || field === 'name') {
                normalizedField = field;
            }

            return { field: normalizedField, value };
        })
        .filter((rule) => rule.value.length > 0);
};

const allowedUsers = parseAllowedUsersEnv(process.env.ALLOWED_USERS ?? '');

const matchesRule = (
    user: { githubId: string; githubLogin: string; email: string; name: string },
    rule: AllowedUserRule
): boolean => {
    switch (rule.field) {
        case 'id':
            return user.githubId === rule.value;
        case 'login':
            return user.githubLogin === rule.value;
        case 'email':
            return user.email === rule.value;
        case 'name':
            return user.name === rule.value;
        case 'any':
            return (
                user.githubId === rule.value ||
                user.githubLogin === rule.value ||
                user.email === rule.value ||
                user.name === rule.value
            );
    }
};

export const isUserAllowed = (session: Session | null | undefined, rules: AllowedUserRule[] = allowedUsers): boolean => {
    if (!session?.user || rules.length === 0) {
        return false;
    }

    const user = {
        githubId: normalize(session.user.githubId),
        githubLogin: normalize(session.user.githubLogin),
        email: normalize(session.user.email),
        name: normalize(session.user.name)
    };

    return rules.some((rule) => matchesRule(user, rule));
};
