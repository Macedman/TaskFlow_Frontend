export interface Board {
    id: string;
    name: string;
    description: string;
}

// One person on a board, as getBoardMembers returns them; the owner comes first
export interface BoardMember {
    user_id: number;
    full_name: string;
    email: string;
    role: 'owner' | 'member';
}
