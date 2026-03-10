export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'PROJECT_MANAGER' | 'SITE_MANAGER' | 'FIELD_WORKER' | 'SUBCONTRACTOR';
    organizationId?: number;
    // Field Data Extensions
    crewName?: string;
    location?: string;
    lastActivity?: string;
    isSubcontractor?: boolean;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}
