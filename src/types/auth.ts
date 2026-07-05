export interface AppUser {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    githubId?: string;
    githubLogin?: string;
}

export interface AppSession {
    user: AppUser;
}
