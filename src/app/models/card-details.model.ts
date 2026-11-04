export interface CardDetails {
    cardId: string;
}

export interface Card {
  card_id: string;
  card_title: string;
}

// The raw cards row returned by POST /api/addTask (not the card_id/card_title shape getTasks uses)
export interface NewCardResponse {
  id: string;
  list_id: string;
  title: string;
  description: string;
  position: number;
  due_date: string | null;
  created_at: string;
}

// The fields POST /api/updateCard accepts; a field left out stays as it is.
export interface CardChanges {
  title?: string;
  description?: string;
}

// One comment from POST /api/getComments or /api/addComment, with its author's name joined in.
export interface CardComment {
  comment_id: number;
  body: string;
  created_at: string;
  updated_at: string | null; // null until the comment is edited
  user_id: number;
  author_name: string;
}

// One attachment from POST /api/getAttachments or /api/addLinkAttachment. Only links exist so far;
// PDFs will have a name and size_bytes instead of a url.
export interface CardAttachment {
  attachment_id: number;
  kind: 'link' | 'pdf';
  name: string | null; // a link's optional display text
  url: string | null;
  size_bytes: number | null;
  created_at: string;
  user_id: number;
  author_name: string;
}

// Returned by POST /api/getTaskDetails. The ids are INTEGER columns, which pg returns as numbers.
export interface CardDetailsResponse {
  card_id: number;
  card_title: string;
  description: string | null;
  position: number;
  due_date: string | null;
  created_at: string;
  list_id: number;
  list_name: string;
  board_id: number;
  board_name: string;
  board_owner_id: number;
}