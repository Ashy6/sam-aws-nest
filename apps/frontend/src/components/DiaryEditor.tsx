import type { FormEvent } from 'react';

type DiaryEditorProps = {
  title: string;
  content: string;
  editing: boolean;
  onTitleChange: (next: string) => void;
  onContentChange: (next: string) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
};

export function DiaryEditor({
  title,
  content,
  editing,
  onTitleChange,
  onContentChange,
  onSubmit,
  onCancel,
}: DiaryEditorProps) {
  return (
    <form onSubmit={onSubmit} className="diary-form">
      <div className="panel-title">{editing ? '编辑日记' : '写日记'}</div>
      <input type="text" placeholder="Title" value={title} onChange={(e) => onTitleChange(e.target.value)} required />
      <textarea placeholder="Content" value={content} onChange={(e) => onContentChange(e.target.value)} required />
      <div className="form-actions">
        <button type="submit">{editing ? '更新' : '添加'} 日记</button>
        {editing && (
          <button type="button" onClick={onCancel}>
            取消
          </button>
        )}
      </div>
    </form>
  );
}

