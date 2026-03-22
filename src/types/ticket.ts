export type TicketStatus = 'Open' | 'In progress' | 'Resolved' | 'Closed';
export type TicketPriority = 'Low' | 'Medium' | 'High';
export type SupportType = 'Ticket' | 'Call' | 'Chat';
export type TicketCategory = 'Complaint' | 'Query' | 'Payment Issue' | 'Technical Issue' | 'Call Request' | 'Chat Request';

export interface Ticket {
    _id: string;
    raisedBy: any; // Can be populated
    raisedByModel: 'User' | 'SingleEmployee' | 'MultipleEmployee' | 'ToolShop';
    supportType: SupportType;
    category: TicketCategory;
    message: string;
    bookingId?: string;
    image?: string;
    status: TicketStatus;
    priority: TicketPriority;
    adminReply?: string;
    createdAt: string;
    updatedAt: string;
}

export interface TicketMessage {
    _id: string;
    ticket: string;
    sender: string;
    senderModel: 'User' | 'SingleEmployee' | 'MultipleEmployee' | 'ToolShop' | 'Admin';
    message: string;
    type: 'text' | 'image' | 'file';
    read: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTicketPayload {
    message: string;
    category: TicketCategory;
    supportType?: SupportType;
    bookingId?: string;
    image?: string;
    priority?: TicketPriority;
}

export interface TicketResponse {
    success: boolean;
    ticket: Ticket;
}

export interface TicketsResponse {
    success: boolean;
    tickets: Ticket[];
}

export interface MessagesResponse {
    success: boolean;
    messages: TicketMessage[];
}

export interface MessageResponse {
    success: boolean;
    message: TicketMessage;
}
