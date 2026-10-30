import { MODES } from '../lib/modes.js'

export default function Header({ mode, count }) {
  const m = MODES[mode]
  return (
    <header className="app-header">
      <h1>
        🏯 제주 역사문화 장소 찾기
        {m.badge && <span className={`badge ${m.cls}`}>{m.badge}</span>}
      </h1>
      <p className="lead">
        {count ? `제주의 역사·문화 장소 ${count}곳을 검색하고 지도에서 확인해 보세요.` : '제주의 역사·문화 장소를 검색하고 지도에서 확인해 보세요.'}
      </p>
    </header>
  )
}
