import { COLS } from './columns.js'
import { clean } from './text.js'

// 일반정보 + 위치정보를 데이터 고유번호로 연결한다 (위치정보 기준으로 목록을 만든다)
export function mergeRows(infoRows, locRows) {
  const info = new Map(infoRows.map((r) => [String(r['데이터 고유번호']), r]))
  return locRows.map((l) => {
    const id = String(l['데이터 고유번호']), g = info.get(id) || {}
    const addr = clean(l['위치'])
    const d = {
      id: Number(id), name: clean(l['장소명']) || clean(g['장소명']),
      lat: parseFloat(l['위도']), lon: parseFloat(l['경도']),
      zip: clean(l['우편번호']), addr, crs: clean(l['좌표계값']), date: clean(l['데이터기준일자']),
      area: addr.includes('서귀포시') ? '서귀포시' : addr.includes('제주시') ? '제주시' : '기타',
      cat: clean(g['분류']) || '미분류', d1: clean(g['디렉토리1']), d2: clean(g['디렉토리2']),
      title: clean(g['제목']), sub: clean(g['부제목']), author: clean(g['저작자']),
      subject: clean(g['주제']).replaceAll('.', ' · '),
      content: clean(g['내용']), toc: clean(g['목차']), abstract: clean(g['초록']),
      publisher: clean(g['발행자']), pubdate: clean(g['발행일']),
      type: clean(g['자료유형']), form: clean(g['자료형태']), lang: clean(g['언어']),
      scope: clean(g['범위']), source: clean(g['출처']), contributor: clean(g['기여자']), ref: clean(g['참고문헌']),
      link: clean(g['링크']) || clean(l['데이터 상세보기 URL']),
    }
    d.hasCoord = Number.isFinite(d.lat) && Number.isFinite(d.lon)
    d.hay = [d.name, d.title, d.subject, d.addr, d.content, d.author].join(' ').replace(/\s+/g, ' ').toLowerCase()
    return d
  })
}

// 필터 선택 상자의 항목: [값, 건수] 목록 (건수 많은 순)
export function buildOptions(places) {
  const count = (key) => {
    const m = new Map()
    places.forEach((d) => { if (d[key]) m.set(d[key], (m.get(d[key]) || 0) + 1) })
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }
  return { cat: count('cat'), d1: count('d1'), area: count('area') }
}

// 검색·필터·정렬을 적용한 목록
export function filterPlaces(places, { q, cat, d1, area, favOnly, sortKey, sortDir }, favs) {
  const needle = q.trim().toLowerCase()
  const col = COLS.find((c) => c.key === sortKey) || COLS[2]
  const cmp = (a, b) => {
    const x = a[col.key] ?? '', y = b[col.key] ?? ''
    if (!x && y) return 1 // 비어 있는 값은 정렬 방향과 상관없이 항상 맨 뒤로
    if (x && !y) return -1
    return (col.num ? x - y : String(x).localeCompare(String(y), 'ko', { numeric: true })) * sortDir
  }
  return places
    .filter((d) =>
      (!cat || d.cat === cat) && (!d1 || d.d1 === d1) && (!area || d.area === area) &&
      (!favOnly || favs.has(d.id)) && (!needle || d.hay.includes(needle)))
    .sort(cmp)
}

// 바닥글에 보여 줄 건수와, 두 API 에서 짝이 맞지 않는 항목 수
export function summarize(info, loc, count) {
  const ids = (res) => new Set(res.data.map((r) => String(r['데이터 고유번호'])))
  const a = ids(info), b = ids(loc)
  return {
    infoCount: info.data.length, locCount: loc.data.length, count,
    noInfo: [...b].filter((id) => !a.has(id)).length,
    noLoc: [...a].filter((id) => !b.has(id)).length,
    fetchedAt: loc.fetchedAt,
  }
}
