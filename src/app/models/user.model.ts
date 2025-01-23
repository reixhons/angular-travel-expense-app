export enum UserRole {
    END_USER = 'END_USER',
    APPROVER = 'APPROVER',
    FINANCE = 'FINANCE'
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
}