import { SORT_KEYS } from './columns.js'

export const DEFAULT_VIEW = {
  q: '', cat: '', d1: '', area: '', favOnly: false, sortKey: 'name', sortDir: 1, selected: null,
}

// 필터·정렬·선택 상태를 주소(#)에 저장해 새로고침·공유·뒤로가기에서도 유지한다
export function readHash() {
  const p = new URLSearchParams(location.hash.slice(1))
  const id = p.get('id') ? Number(p.get('id')) : NaN
  return {
    q: p.get('q') || '',
    cat: p.get('cat') || '',
    d1: p.get('d1') || '',
    area: p.get('area') || '',
    favOnly: p.get('fav') === '1',
    sortKey: SORT_KEYS.includes(p.get('sort')) ? p.get('sort') : 'name',
    sortDir: p.get('desc') === '1' ? -1 : 1,
    selected: Number.isFinite(id) ? id : null,
  }
}

export function writeHash(view) {
  const p = new URLSearchParams()
  if (view.q) p.set('q', view.q)
  if (view.cat) p.set('cat', view.cat)
  if (view.d1) p.set('d1', view.d1)
  if (view.area) p.set('area', view.area)
  if (view.favOnly) p.set('fav', '1')
  if (view.sortKey !== 'name') p.set('sort', view.sortKey)
  if (view.sortDir < 0) p.set('desc', '1')
  if (view.selected != null) p.set('id', view.selected)
  const h = p.toString()
  try {
    history.replaceState(null, '', location.pathname + location.search + (h ? '#' + h : ''))
  } catch { /* 일부 환경에서는 주소 변경이 막힐 수 있다 */ }
}
