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
}