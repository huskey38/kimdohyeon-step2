import { SORT_PRESETS } from '../lib/columns.js'

const Options = ({ label, items }) => (
  <>
    <option value="">{label} 전체</option>
    {items.map(([v, n]) => <option key={v} value={v}>{v} ({n})</option>)}
  </>
)

// 검색창, 필터·정렬 선택, 관심 장소만 보기, CSV 내려받기, 초기화
export default function Toolbar({ view, options, favCount, onPatch, onCsv, onReset }) {
  const preset = Object.entries(SORT_PRESETS).find(([, [k, dir]]) => k === view.sortKey && dir === view.sortDir)
  return (
    <>
      <div className="toolbar">
        <input
          className="search" type="search" aria-label="검색" value={view.q}
          placeholder="장소명 · 자료 제목 · 주제 · 주소 · 내용 검색"
          onChange={(e) => onPatch({ q: e.target.value })}
        />
        <select aria-label="분류" title="분류: 자료가 속한 큰 갈래 (민속 / 확장분야)" value={view.cat} onChange={(e) => onPatch({ cat: e.target.value })}>
          <Options label="분류" items={options.cat} />
        </select>
        <select aria-label="디렉토리" title="디렉토리: 자료를 주제별로 나눈 목록" value={view.d1} onChange={(e) => onPatch({ d1: e.target.value })}>
          <Options label="디렉토리" items={options.d1} />
        </select>
        <select aria-label="지역" title="지역: 주소에서 가려낸 제주시 / 서귀포시" value={view.area} onChange={(e) => onPatch({ area: e.target.value })}>
          <Options label="지역" items={options.area} />
        </select>
        <select
          aria-label="정렬" value={preset ? preset[0] : 'custom'}
          onChange={(e) => { const [sortKey, sortDir] = SORT_PRESETS[e.target.value]; onPatch({ sortKey, sortDir }) }}
        >
          <option value="name">장소명 가나다순</option>
          <option value="dateDesc">발행일 최신순</option>
          <option value="dateAsc">발행일 오래된순</option>
          <option value="id">번호순</option>
          <option value="custom" disabled>열 제목으로 정렬 중</option>
        </select>
      </div>
      <div className="actions">
        <button type="button" aria-pressed={view.favOnly} onClick={() => onPatch({ favOnly: !view.favOnly })}>
          {view.favOnly ? '★' : '☆'} 관심 장소만 보기 ({favCount})
        </button>
        <button type="button" onClick={onCsv}>⬇ 현재 목록 CSV 내려받기</button>
        <button type="button" onClick={onReset}>필터 초기화</button>
      </div>
    </>
  )
}
