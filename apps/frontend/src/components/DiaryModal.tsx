import { useEffect, useState } from 'react';
import type { Diary } from '../types/diary';

type DiaryModalProps = {
  diary: Diary;
  open: boolean;
  onClose: () => void;
  onSave: (next: { title: string; content: string }) => Promise<void>;
};

export function DiaryModal({ diary, open, onClose, onSave }: DiaryModalProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(diary.title);
  const [content, setContent] = useState(diary.content);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEditing(false);
    setTitle(diary.title);
    setContent(diary.content);
  }, [diary.content, diary.title, open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const canSave = title.trim().length > 0 && content.trim().length > 0 && !saving;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="日记详情弹框"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{editing ? '编辑日记' : '日记详情'}</div>
          <button type="button" className="modal-close" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="modal-meta">{new Date(diary.createdAt).toLocaleString()}</div>

        {editing ? (
          <div className="modal-form">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              required
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Content"
              required
            />
          </div>
        ) : (
          <div className="modal-content">
            <div className="modal-diary-title">{diary.title}</div>
            <div className="modal-diary-content">{diary.content}</div>
          </div>
        )}

        <div className="modal-actions">
          {editing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setTitle(diary.title);
                  setContent(diary.content);
                }}
                disabled={saving}
              >
                取消
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!canSave) return;
                  setSaving(true);
                  try {
                    await onSave({ title: title.trim(), content: content.trim() });
                    setEditing(false);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={!canSave}
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setEditing(true)}>
              编辑
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

