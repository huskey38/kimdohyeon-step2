import { COLS } from '../lib/columns.js'
import Highlight from './Highlight.jsx'

function StarButton({ place, on, onToggle }) {
  return (
    <button
      type="button" className={`star ${on ? 'on' : ''}`} aria-pressed={on}
      aria-label={`${place.name} 관심 장소 ${on ? '해제' : '저장'}`} title={on ? '관심 장소 해제' : '관심 장소로 저장'}
      onClick={(e) => { e.stopPropagation(); onToggle(place.id) }}
    >
      {on ? '★' : '☆'}
    </button>
  )
}

// 결과가 0건일 때 다음에 할 일을 안내한다
function EmptyBox({ favOnly, hasFavs, onReset, onShowAll }) {
  if (favOnly && !hasFavs) {
    return (
      <div className="empty-box">
        <b>☆ 관심 장소가 아직 없어요.</b>목록에서 ☆를 눌러 저장하면 여기에 모여요.<br />
        <button type="button" onClick={onShowAll}>전체 장소 보기</button>
      </div>
    )
  }
  return (
    <div className="empty-box">
      <b>조건에 맞는 장소가 없어요.</b>검색어를 줄이거나 철자를 바꿔 보세요. (예: "한라산" → "한라")<br />
      분류·지역 필터가 걸려 있다면 풀어 보세요.<br />
      <button type="button" onClick={onReset}>필터 초기화</button>
    </div>
  )
}

// 데스크톱은 표, 모바일은 CSS 로 카드 목록이 된다 (각 칸의 data-label 이 카드의 항목 이름)
export default function PlaceTable({ rows, total, favs, view, onSelect, onToggleFav, onSort, onReset, onShowAll }) {
  const cell = {
    fav: (d) => <StarButton place={d} on={favs.has(d.id)} onToggle={onToggleFav} />,
    id: (d) => d.id,
    name: (d) => <Highlight text={d.name} q={view.q} />,
    cat: (d) => <span className="tag">{d.cat}</span>,
    d1: (d) => [d.d1, d.d2].filter(Boolean).join(' · '),
    title: (d) => <Highlight text={d.title} q={view.q} />,
    area: (d) => d.area,
    pubdate: (d) => d.pubdate,
  }
  return (
    <>
      <div className="bar" aria-live="polite">{rows.length} / {total}건 · 관심 장소 {favs.size}곳</div>
      <div className="tablewrap">
        <table aria-label="제주 역사문화 장소 목록">
          <thead>
            <tr>
              {COLS.map((c) => {
                if (c.sortable === false) return <th key={c.key} scope="col" title={c.tip} aria-label="관심 장소">{c.label}</th>
                const on = c.key === view.sortKey
                return (
                  <th
                    key={c.key} scope="col" tabIndex={0} className="sortable" title={`${c.tip || c.label} (눌러서 정렬)`}
                    aria-sort={on ? (view.sortDir > 0 ? 'ascending' : 'descending') : 'none'}
                    onClick={() => onSort(c.key)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSort(c.key) } }}
                  >
                    {c.label}<span className="ar">{on ? (view.sortDir > 0 ? ' ▲' : ' ▼') : ''}</span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={COLS.length} className="empty">
                  <EmptyBox favOnly={view.favOnly} hasFavs={favs.size > 0} onReset={onReset} onShowAll={onShowAll} />
                </td>
              </tr>
            )}
            {rows.map((d) => (
              <tr
                key={d.id} tabIndex={0} className={view.selected === d.id ? 'sel' : ''}
                onClick={() => onSelect(d.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) onSelect(d.id) }}
              >
                {COLS.map((c) => <td key={c.key} className={c.cls || ''} data-label={c.mlabel || c.label}>{cell[c.key](d)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
