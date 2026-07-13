import api from './api';

export interface ITicketComment {
  _id: string;
  message: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  createdAt: string;
}

export interface ITicket {
  _id: string;
  ticketNumber: string;
  type: 'CONCERN' | 'COMPLAINT' | 'QUERY' | 'TECHNICAL' | 'OTHER';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  raisedBy: string;
  raisedByName?: string;
  assignedTo?: string;
  assignedToName?: string;
  finalClass?: string;
  studentName?: string;
  subject: string;
  description?: string;
  comments: ITicketComment[];
  resolvedAt?: string;
  resolvedBy?: string;
  resolvedByName?: string;
  resolutionNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ITicketStats {
  open: number;
  inProgress: number;
  resolved: number;
  total: number;
}

export interface IListTicketsParams {
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
}

export const listTickets = async (params?: IListTicketsParams): Promise<{ data: ITicket[]; total: number; page: number; pages: number }> => {
  const { data } = await api.get('/api/v1/tickets', { params });
  return data;
};

export const getTicketStats = async (): Promise<{ data: ITicketStats }> => {
  const { data } = await api.get('/api/v1/tickets/stats');
  return data;
};

export const getTicket = async (id: string): Promise<{ data: ITicket }> => {
  const { data } = await api.get(`/api/v1/tickets/${id}`);
  return data;
};

export const addTicketComment = async (id: string, message: string): Promise<{ data: ITicket }> => {
  const { data } = await api.post(`/api/v1/tickets/${id}/comments`, { message });
  return data;
};

export const updateTicketStatus = async (
  id: string,
  payload: { status: string; resolutionNote?: string }
): Promise<{ data: ITicket }> => {
  const { data } = await api.patch(`/api/v1/tickets/${id}/status`, payload);
  return data;
};
