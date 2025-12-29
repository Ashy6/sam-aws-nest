import type { Diary, CreateDiaryDto, UpdateDiaryDto } from '../types/diary';

const API_URL = 'http://localhost:3000/diary';

export const diaryService = {
  findAll: async (): Promise<Diary[]> => {
    const response = await fetch(API_URL);
    return response.json();
  },

  findOne: async (id: number): Promise<Diary> => {
    const response = await fetch(`${API_URL}/${id}`);
    return response.json();
  },

  create: async (data: CreateDiaryDto): Promise<Diary> => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  update: async (id: number, data: UpdateDiaryDto): Promise<Diary> => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  remove: async (id: number): Promise<void> => {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  },
};
