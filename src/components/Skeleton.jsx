// 불러오는 동안 보여 주는 표 모양 뼈대 화면
export default function Skeleton() {
  return (
    <div className="card skeleton" aria-hidden="true">
      <div className="sk-bar" />
      {Array.from({ length: 8 }, (_, i) => <div key={i} className="sk-row" />)}
    </div>
  )
}
