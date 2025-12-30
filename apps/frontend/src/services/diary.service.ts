import type { ErrorResponse, Diary, CreateDiaryDto, UpdateDiaryDto, ErrorResponseType } from '../types/diary';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';
const normalizedApiBaseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
const API_URL = `${normalizedApiBaseUrl}/diary`;

export const diaryService = {
  findAll: async (): Promise<Diary[] | ErrorResponse> => {
    const response = await fetch(API_URL);
    return response.json();
  },

  findOne: async (id: number): Promise<ErrorResponseType> => {
    const response = await fetch(`${API_URL}/${id}`);
    return response.json();
  },

  create: async (data: CreateDiaryDto): Promise<ErrorResponseType> => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  update: async (id: number, data: UpdateDiaryDto): Promise<ErrorResponseType> => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  remove: async (id: number): Promise<void | ErrorResponse> => {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  },
};
