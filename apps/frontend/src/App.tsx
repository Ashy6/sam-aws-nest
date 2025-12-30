import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import { diaryService } from './services/diary.service';
import type { Diary, ErrorResponse } from './types/diary';
import { GithubPanel } from './components/GithubPanel';
import { DiaryEditor } from './components/DiaryEditor';
import { DiaryDetail } from './components/DiaryDetail';
import { DiaryGrid } from './components/DiaryGrid';

function App() {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const githubUsername = import.meta.env.GITHUB_USERNAME ?? 'ashy6';

  const loadDiaries = useCallback(async (preferSelectedId?: number) => {
    setApiLoading(true);
    setApiError(null);
    try {
      const data = await diaryService.findAll();
      if (Array.isArray(data)) {
        setDiaries(data as Diary[]);
        setSelectedId((prev) => {
          const candidate = preferSelectedId ?? prev;
          if (candidate != null && (data as Diary[]).some((d) => d.id === candidate)) return candidate;
          return (data as Diary[])[0]?.id ?? null;
        });
        return;
      }

      const statusCode = (data as ErrorResponse | null | undefined)?.statusCode;
      if (typeof statusCode === 'number') {
        setDiaries([]);
        setSelectedId(null);
        setApiError(`接口错误（${statusCode}）`);
        return;
      }

      setApiError('接口返回格式异常');
    } catch {
      setApiError('接口不可用，请稍后重试');
    } finally {
      setApiLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDiaries();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDiaries]);

  const orderedDiaries = useMemo(() => {
    return [...diaries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [diaries]);

  const selectedDiary = useMemo(() => {
    if (!selectedId) return null;
    return orderedDiaries.find((d) => d.id === selectedId) ?? null;
  }, [orderedDiaries, selectedId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    try {
      if (editingId) {
        await diaryService.update(editingId, { title, content });
        const updatedId = editingId;
        setEditingId(null);
        await loadDiaries(updatedId);
      } else {
        await diaryService.create({ title, content });
        await loadDiaries();
      }
      setTitle('');
      setContent('');
    } catch {
      setApiError('保存失败：接口不可用');
    }
  };

  const handleEdit = (diary: Diary) => {
    setEditingId(diary.id);
    setTitle(diary.title);
    setContent(diary.content);
    setSelectedId(diary.id);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await diaryService.remove(id);
      await loadDiaries();
    } catch {
      setApiError('删除失败：接口不可用');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
  };

  return (
    <div className="container">
      <header className="page-header">
        <h1 className="page-title">开心 日记</h1>
        <div className="api-status">
          {apiLoading ? <span className="api-status-text">加载中…</span> : null}
          {apiError ? <span className="api-status-error">{apiError}</span> : null}
          <button type="button" className="api-status-retry" onClick={() => void loadDiaries()} disabled={apiLoading}>
            重试
          </button>
        </div>
      </header>

      <div className="top-layout">
        <div className="left-column">
          <DiaryEditor
            title={title}
            content={content}
            editing={editingId !== null}
            onTitleChange={setTitle}
            onContentChange={setContent}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
          <DiaryDetail diary={selectedDiary} onEdit={handleEdit} onDelete={handleDelete} />
          <DiaryGrid
            diaries={orderedDiaries}
            selectedId={selectedId}
            onSelect={(diary) => setSelectedId(diary.id)}
          />
        </div>
        <div className="right-column">
          <GithubPanel username={githubUsername} />
        </div>
      </div>
    </div>
  );
}

export default App;
