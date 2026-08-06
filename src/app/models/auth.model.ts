export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string,
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
