import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getClassLeads,
  createClassLead,
  updateClassLead,
  deleteClassLead,
  updateClassLeadStatus,
} from '../services/leadService';
import { IClassLead, IClassLeadFormData, PaginatedResponse } from '../types';

export type LeadsFilters = {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  studentName?: string;
  grade?: string;
  subject?: string;
  board?: string;
  mode?: string;
  createdByName?: string;
  area?: string;
  leadSource?: string;
};

const useClassLeads = (filters: LeadsFilters = {}) => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<IClassLead[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res: PaginatedResponse<IClassLead[]> = await getClassLeads({
        page: filters.page,
        limit: filters.limit,
        status: filters.status,
        search: filters.search,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        studentName: filters.studentName,
        grade: filters.grade,
        subject: filters.subject,
        board: filters.board,
        mode: filters.mode,
        createdByName: filters.createdByName,
        area: filters.area,
        leadSource: filters.leadSource,
      });
      setLeads(res.data);
      setPagination(res.pagination);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to fetch class leads');
    } finally {
      setLoading(false);
    }
  }, [
    filters.page,
    filters.limit,
    filters.status,
    filters.search,
    filters.sortBy,
    filters.sortOrder,
    filters.studentName,
    filters.grade,
    filters.subject,
    filters.board,
    filters.mode,
    filters.createdByName,
    filters.area,
    filters.leadSource,
  ]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Refetch when window gains focus or tab visibility changes back to visible
  useEffect(() => {
    const onFocus = () => fetchLeads();
    const onVisibility = () => { if (document.visibilityState === 'visible') fetchLeads(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchLeads]);

  const refetch = fetchLeads;

  const createLead = async (payload: IClassLeadFormData) => {
    const res = await createClassLead(payload);
    await fetchLeads();
    const createdId = (res as any)?.data?.id || (res as any)?.data?._id;
    if (createdId) navigate(`/class-leads/${createdId}`);
    return res;
  };

  const updateLead = async (leadId: string, payload: Partial<IClassLeadFormData>) => {
    const res = await updateClassLead(leadId, payload);
    await fetchLeads();
    return res;
  };

  const removeLead = async (leadId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this lead?');
    if (!confirmed) return;
    const res = await deleteClassLead(leadId);
    await fetchLeads();
    return res;
  };

  const updateStatus = async (leadId: string, status: string) => {
    const res = await updateClassLeadStatus(leadId, status);
    await fetchLeads();
    return res;
  };

  return { leads, loading, error, pagination, refetch, createLead, updateLead, deleteLead: removeLead, updateStatus };
};

export default useClassLeads;
