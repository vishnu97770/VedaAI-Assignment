import axios from 'axios';

const API_BASE = 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const createAssignment = async (data: object) => {
  const response = await api.post('/assignments/create', data);
  return response.data;
};

export const getAllAssignments = async () => {
  const response = await api.get('/assignments/all');
  return response.data;
};

export const getAssignment = async (id: string) => {
  const response = await api.get(`/assignments/${id}`);
  return response.data;
};