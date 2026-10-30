// 바닥글: 불러온 건수와 데이터 출처(조회 시각 / 파일 기준일)
export default function Footer({ mode, summary }) {
  if (!summary) return <footer className="foot" />
  const { infoCount, locCount, count, noInfo, noLoc, fetchedAt } = summary
  const counts = `일반정보 ${infoCount}건 + 위치정보 ${locCount}건 → ${count}건`
  const fetched = new Date(fetchedAt).toLocaleString('ko-KR')
  const warn = noInfo || noLoc ? ` · 짝이 없는 항목: 일반정보 없음 ${noInfo}건, 위치정보 없음 ${noLoc}건 (위치정보 기준으로 표시)` : ''
  const text = mode === 'snapshot'
    ? `저장된 데이터 · ${counts} · 마지막 성공 조회 ${fetched}${warn}`
    : mode === 'sample'
      ? `연습 모드 · 1단계 파일 데이터 ${counts} · 파일 데이터 기준일 2022-12-09${warn}`
      : `${counts} · 서버 조회 시각 ${fetched}${warn}`
  return <footer className="foot">{text}</footer>
}
