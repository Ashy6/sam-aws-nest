import type { Diary } from '../types/diary';

type DiaryDetailProps = {
  diary: Diary | null;
  onEdit: (diary: Diary) => void;
  onDelete: (id: number) => void;
};

export function DiaryDetail({ diary, onEdit, onDelete }: DiaryDetailProps) {
  if (!diary) {
    return (
      <section className="panel diary-detail" aria-label="日记详情">
        <div className="panel-title">日记内容</div>
        <div className="diary-detail-empty">从下方网格里选择一篇日记查看。</div>
      </section>
    );
  }

  return (
    <section className="panel diary-detail" aria-label="日记详情">
      <div className="diary-detail-top">
        <div className="diary-detail-kicker">当前选择</div>
        <div className="diary-detail-actions">
          <button type="button" onClick={() => onEdit(diary)}>
            编辑
          </button>
          <button type="button" onClick={() => onDelete(diary.id)}>
            删除
          </button>
        </div>
      </div>
      <div className="diary-detail-title">{diary.title}</div>
      <div className="diary-detail-meta">{new Date(diary.createdAt).toLocaleString()}</div>
      <div className="diary-detail-content">{diary.content}</div>
    </section>
  );
}
