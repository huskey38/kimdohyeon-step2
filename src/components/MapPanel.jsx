import { useEffect, useMemo, useState } from 'react'
import LeafletMap from './LeafletMap.jsx'
import SvgMap from './SvgMap.jsx'

// 지도 카드. 실제 지도(타일은 인터넷 필요)를 쓰다가, 인터넷이 없으면 간단 지도로 바꾼다.
export default function MapPanel({ places, rows, selectedId, favs, focus, fitKey, onMarkerSelect, onPointSelect, onToggleFav, onOpenDetail }) {
  const [offline, setOffline] = useState(() => navigator.onLine === false)
  useEffect(() => {
    const goOffline = () => setOffline(true)
    window.addEventListener('offline', goOffline)
    return () => window.removeEventListener('offline', goOffline)
  }, [])
  const rowIds = useMemo(() => new Set(rows.map((d) => d.id)), [rows])

  return (
    <section className="card map">
      {offline
        ? <SvgMap places={places} rowIds={rowIds} selectedId={selectedId} favs={favs} onSelect={onPointSelect} />
        : (
          <LeafletMap
            places={places} rows={rows} selectedId={selectedId} favs={favs} focus={focus} fitKey={fitKey}
            onMarkerSelect={onMarkerSelect} onToggleFav={onToggleFav} onOpenDetail={onOpenDetail}
            onOffline={() => setOffline(true)}
          />
        )}
      <div className="legend">
        <span><i className="c" style={{ background: 'var(--a)' }} />● 민속</span>
        <span><i className="d" style={{ background: 'var(--b)' }} />◆ 확장분야</span>
        <span>★ 관심 장소</span>
      </div>
      {offline && (
        <p className="map-note">
          인터넷에 연결되지 않아 간단 지도로 보여 드려요. <button type="button" onClick={() => setOffline(false)}>실제 지도 다시 불러오기</button>
        </p>
      )}
    </section>
  )
}
