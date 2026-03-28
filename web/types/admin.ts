/** Shape of a user row returned from `GET /users/admin/list` (password stripped). */
export type AdminUserSearchProfile = {
    first_name?: string | null;
    last_name?: string | null;
};

export type AdminUserSearchRow = {
    id: number;
    email?: string | null;
    phone?: string | null;
    profile?: AdminUserSearchProfile | null;
};
