import api from './client';
import { 
    CreateTicketPayload, 
    MessageResponse, 
    MessagesResponse, 
    TicketResponse, 
    TicketsResponse 
} from '../types/ticket';

export const ticketApi = {
    /**
     * Create a new support ticket
     */
    createTicket: async (payload: CreateTicketPayload): Promise<TicketResponse> => {
        const response = await api.post('/tickets', payload);
        return response.data;
    },

    /**
     * Get all tickets raised by the current user
     */
    getMyTickets: async (): Promise<TicketsResponse> => {
        const response = await api.get('/tickets/my-tickets');
        return response.data;
    },

    /**
     * Get ticket details by ID
     */
    getTicketById: async (id: string): Promise<TicketResponse & { messages: any[] }> => {
        const response = await api.get(`/tickets/${id}`);
        return response.data;
    },

    /**
     * Get chat messages for a specific ticket
     */
    getChatMessages: async (ticketId: string): Promise<MessagesResponse> => {
        const response = await api.get(`/tickets/${ticketId}/messages`);
        return response.data;
    },

    /**
     * Send a chat message for a specific ticket
     */
    sendChatMessage: async (ticketId: string, message: string, type: string = 'text'): Promise<MessageResponse> => {
        const response = await api.post(`/tickets/${ticketId}/messages`, { message, type });
        return response.data;
    }
};

export default ticketApi;
