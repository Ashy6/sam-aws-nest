/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from 'react';
import './App.css';
import { diaryService } from './services/diary.service';
import type { Diary } from './types/diary';

function App() {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    loadDiaries();
  }, []);

  const loadDiaries = async () => {
    try {
      const data = await diaryService.findAll();
      setDiaries(data);
    } catch (error) {
      console.error('Failed to load diaries', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    try {
      if (editingId) {
        await diaryService.update(editingId, { title, content });
        setEditingId(null);
      } else {
        await diaryService.create({ title, content });
      }
      setTitle('');
      setContent('');
      loadDiaries();
    } catch (error) {
      console.error('Failed to save diary', error);
    }
  };

  const handleEdit = (diary: Diary) => {
    setEditingId(diary.id);
    setTitle(diary.title);
    setContent(diary.content);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await diaryService.remove(id);
      loadDiaries();
    } catch (error) {
      console.error('Failed to delete diary', error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
  };

  return (
    <div className="container">
      <h1>开心 日记</h1>

      <form onSubmit={handleSubmit} className="diary-form">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <div className="form-actions">
          <button type="submit">{editingId ? '更新' : '添加'} 日记</button>
          {editingId && <button type="button" onClick={handleCancel}>取消</button>}
        </div>
      </form>

      <div className="diary-list">
        {diaries.map((diary) => (
          <div key={diary.id} className="diary-card">
            <h3>{diary.title}</h3>
            <p>{diary.content}</p>
            <small>{new Date(diary.createdAt).toLocaleString()}</small>
            <div className="card-actions">
              <button onClick={() => handleEdit(diary)}>编辑</button>
              <button onClick={() => handleDelete(diary.id)}>删除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
