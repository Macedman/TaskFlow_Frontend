export interface ListType {
    [key: string]: Card[];
}

export interface Card {
    card_id: string;
    card_title: string;
}