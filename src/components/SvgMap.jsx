import { useMemo } from 'react'
import { convexHull, makeProject } from '../lib/geo.js'

// 인터넷이 없을 때 쓰는 간단 지도: 점 분포의 바깥선과 지역 이름을 배경으로 깔고, 점은 키보드로도 고를 수 있다
export default function SvgMap({ places, rowIds, selectedId, favs, onSelect }) {
  const pts = useMemo(() => {
    const project = makeProject(places)
    return places.filter((d) => d.hasCoord).map((d) => ({ d, xy: project(d) }))
  }, [places])
  const hull = useMemo(() => (pts.length > 2 ? convexHull(pts.map((p) => p.xy)) : null), [pts])
  const labels = useMemo(() => ['제주시', '서귀포시'].map((area) => {
    const a = pts.filter((p) => p.d.area === area)
    if (!a.length) return null
    return { area, x: a.reduce((s, p) => s + p.xy[0], 0) / a.length, y: a.reduce((s, p) => s + p.xy[1], 0) / a.length }
  }).filter(Boolean), [pts])
  // 선택된 점이 다른 점에 가려지지 않도록 마지막에 그린다
  const ordered = useMemo(() => [...pts].sort((a, b) => (a.d.id === selectedId) - (b.d.id === selectedId)), [pts, selectedId])

  return (
    <svg className="svgmap" viewBox="0 0 640 340" role="group" aria-label="장소 위치 간단 지도">
      {hull && (
        <polygon
          points={hull.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ')}
          fill="var(--accent-soft)" stroke="var(--accent-soft)" strokeWidth="34" strokeLinejoin="round" opacity=".7"
        />
      )}
      {labels.map((l) => (
        <text key={l.area} x={l.x} y={l.y} textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--muted)" opacity=".45" pointerEvents="none">{l.area}</text>
      ))}
      <text x="10" y="18" fontSize="12" fill="var(--muted)">↑ 북</text>
      {ordered.map(({ d, xy }) => {
        const sel = selectedId === d.id, folk = d.cat === '민속', fill = folk ? 'var(--a)' : 'var(--b)'
        return (
          <g
            key={d.id} className={`pt ${rowIds.has(d.id) ? '' : 'off'}`} transform={`translate(${xy[0].toFixed(1)} ${xy[1].toFixed(1)})`}
            tabIndex={0} role="button" aria-label={`${d.name} (${d.cat})`}
            onClick={() => onSelect(d.id)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(d.id) } }}
          >
            {folk
              ? <circle className="shape" r={sel ? 8 : 5.5} fill={fill} stroke="#fff" strokeWidth="1" />
              : <rect className="shape" x={sel ? -7 : -5} y={sel ? -7 : -5} width={sel ? 14 : 10} height={sel ? 14 : 10} transform="rotate(45)" fill={fill} stroke="#fff" strokeWidth="1" />}
            {favs.has(d.id) && <circle r="11" fill="none" stroke="#f5b301" strokeWidth="2.5" />}
            {sel && <circle r="12" fill="none" stroke="var(--sel)" strokeWidth="2" />}
            <title>{d.name}</title>
          </g>
        )
      })}
    </svg>
  )
}
