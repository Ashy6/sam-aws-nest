import type { Diary } from '../types/diary';

type DiaryGridProps = {
  diaries: Diary[];
  selectedId: number | null;
  onSelect: (diary: Diary) => void;
};

function getPreviewText(content: string) {
  return content.replace(/\s+/g, ' ').trim();
}

export function DiaryGrid({ diaries, selectedId, onSelect }: DiaryGridProps) {
  return (
    <section className="panel diary-grid-panel" aria-label="日记网格">
      <div className="panel-title">日记</div>
      {diaries.length === 0 ? (
        <div className="diary-grid-empty">还没有日记，先写一篇吧。</div>
      ) : (
        <div className="diary-grid">
          {diaries.map((diary) => (
            <article
              key={diary.id}
              className={`diary-grid-card${selectedId === diary.id ? ' is-selected' : ''}`}
              onClick={() => onSelect(diary)}
            >
              <div className="diary-grid-card-top">
                <div className="diary-grid-title">{diary.title}</div>
                <div className="diary-grid-date">{new Date(diary.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="diary-grid-preview">{getPreviewText(diary.content)}</div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
