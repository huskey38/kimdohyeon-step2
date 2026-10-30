import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import DetailPanel from './components/DetailPanel.jsx'
import Footer from './components/Footer.jsx'
import Header from './components/Header.jsx'
import HowTo from './components/HowTo.jsx'
import MapPanel from './components/MapPanel.jsx'
import PlaceTable from './components/PlaceTable.jsx'
import Skeleton from './components/Skeleton.jsx'
import Status from './components/Status.jsx'
import Toolbar from './components/Toolbar.jsx'
import { useFavorites } from './hooks/useFavorites.js'
import { useMediaQuery } from './hooks/useMediaQuery.js'
import { usePlaces } from './hooks/usePlaces.js'
import { useViewState } from './hooks/useViewState.js'
import { downloadCsv } from './lib/csv.js'
import { buildOptions, filterPlaces, summarize } from './lib/data.js'
import { DEFAULT_VIEW } from './lib/hash.js'
import { MODES, TITLE } from './lib/modes.js'

function App() {
  const { status, text, mode, errs, info, loc, places, retry } = usePlaces()
  const [favs, toggleFav] = useFavorites()
  const [view, patch] = useViewState()
  const isMobile = useMediaQuery('(max-width: 700px)')
  const isNarrow = useMediaQuery('(max-width: 980px)')
  const [sheetOpen, setSheetOpen] = useState(false) // 모바일에서 상세를 전체 화면으로 열었는지
  const [focus, setFocus] = useState(null) // 지도에 "이 장소로 이동해서 말풍선을 열어 줘" 요청
  const detailRef = useRef(null)

  const ready = status === 'ready'
  const byId = useMemo(() => new Map(places.map((d) => [d.id, d])), [places])
  const options = useMemo(() => buildOptions(places), [places])
  const rows = useMemo(
    () => filterPlaces(places, view, favs),
    // eslint-disable-next-line -- 선택(view.selected)이 바뀔 때는 목록을 다시 계산하지 않는다
    [places, view.q, view.cat, view.d1, view.area, view.favOnly, view.sortKey, view.sortDir, favs],
  )
  const summary = useMemo(() => (ready && info && loc ? summarize(info, loc, places.length) : null), [ready, info, loc, places.length])
  const fitKey = [view.q, view.cat, view.d1, view.area, view.favOnly].join('|') // 이 값이 바뀌면 지도를 결과에 맞춘다
  const selected = byId.get(view.selected)

  // 데이터가 새로 들어오면, 주소에 담겨 있던 값 중 없는 필터·장소는 해제한다
  // (effect 가 아니라 렌더 중에 상태를 맞추는 방식: React 가 권장하는 "이전 값과 비교해 조정" 패턴)
  const [checkedPlaces, setCheckedPlaces] = useState(null)
  if (places.length && checkedPlaces !== places) {
    setCheckedPlaces(places)
    patch((v) => {
      const out = {}
      if (v.cat && !options.cat.some(([x]) => x === v.cat)) out.cat = ''
      if (v.d1 && !options.d1.some(([x]) => x === v.d1)) out.d1 = ''
      if (v.area && !options.area.some(([x]) => x === v.area)) out.area = ''
      if (v.selected != null && !byId.has(v.selected)) out.selected = null
      return out
    })
  }

  // 공유받은 주소(#id=…)로 처음 열면 그 장소로 지도를 옮기고, 모바일은 상세를 바로 연다
  const [introduced, setIntroduced] = useState(false)
  if (!introduced && places.length) {
    setIntroduced(true)
    if (view.selected != null && byId.has(view.selected)) {
      setFocus({ id: view.selected, n: 1 })
      if (isMobile) setSheetOpen(true)
    }
  }

  useEffect(() => {
    document.title = (ready ? MODES[mode].prefix : '') + TITLE
  }, [ready, mode])

  // 선택된 행이 목록 화면 밖이면 보이는 곳까지만 스크롤한다
  useEffect(() => {
    document.querySelector('tbody tr.sel')?.scrollIntoView({ block: 'nearest' })
  }, [view.selected, ready])

  // 모바일 상세 시트: 열려 있으면 뒤 화면 스크롤 잠금, Esc 로 닫기, 넓은 화면으로 바뀌면 닫기
  useEffect(() => {
    document.body.classList.toggle('lock', sheetOpen && isMobile)
    return () => document.body.classList.remove('lock')
  }, [sheetOpen, isMobile])
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setSheetOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])
  // 넓은 화면으로 바뀌면 시트를 닫는다 (이전 값과 비교해 렌더 중에 조정)
  const [wasMobile, setWasMobile] = useState(isMobile)
  if (wasMobile !== isMobile) {
    setWasMobile(isMobile)
    if (!isMobile) setSheetOpen(false)
  }

  // pan: 지도를 그 핀으로 옮기고 말풍선을 연다 / scroll: 좁은 화면에서 상세로 스크롤 / sheet: 모바일 상세 시트 열기
  const select = useCallback((id, { pan = true, scroll = true, sheet = true } = {}) => {
    patch({ selected: id })
    if (pan && !isMobile) setFocus({ id, n: Date.now() })
    if (isMobile) { if (sheet) setSheetOpen(true) }
    else if (scroll && isNarrow) detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [patch, isMobile, isNarrow])
  const selectFromMarker = useCallback((id) => select(id, { pan: false, scroll: false, sheet: false }), [select])
  const selectFromPoint = useCallback((id) => select(id, { scroll: false }), [select])
  const openDetail = useCallback((id) => {
    patch({ selected: id })
    if (isMobile) setSheetOpen(true)
    else detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [patch, isMobile])

  const reset = () => { patch({ ...DEFAULT_VIEW }); setSheetOpen(false) }
  const sortBy = (key) => patch((v) => ({ sortDir: v.sortKey === key ? -v.sortDir : 1, sortKey: key }))

  return (
    <>
      <Header mode={ready ? mode : 'live'} count={ready ? places.length : 0} />
      <HowTo />
      <Status
        status={status} text={text} mode={mode} errs={errs} onRetry={retry}
        fetchedLabel={summary ? new Date(summary.fetchedAt).toLocaleString('ko-KR') : ''}
      />
      {status === 'loading' && <Skeleton />}
      {ready && (
        <div className="layout">
          <main className="card">
            <Toolbar view={view} options={options} favCount={favs.size} onPatch={patch} onCsv={() => downloadCsv(rows)} onReset={reset} />
            <PlaceTable
              rows={rows} total={places.length} favs={favs} view={view}
              onSelect={select} onToggleFav={toggleFav} onSort={sortBy} onReset={reset} onShowAll={() => patch({ favOnly: false })}
            />
          </main>
          <aside className="side">
            <MapPanel
              places={places} rows={rows} selectedId={view.selected} favs={favs} focus={focus} fitKey={fitKey}
              onMarkerSelect={selectFromMarker} onPointSelect={selectFromPoint} onToggleFav={toggleFav} onOpenDetail={openDetail}
            />
            <DetailPanel
              ref={detailRef} place={selected} isFav={selected ? favs.has(selected.id) : false}
              open={sheetOpen} onToggleFav={toggleFav} onBack={() => setSheetOpen(false)}
            />
          </aside>
        </div>
      )}
      <Footer mode={mode} summary={summary} />
    </>
  )
}

export default App
