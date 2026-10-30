import { VISITOR_MESSAGE } from '../lib/api.js'

// 관리자용 상세: 방문자에게는 접어 두고, 필요할 때만 펼쳐 본다
function AdminDetails({ errs }) {
  if (!errs.length) return null
  return (
    <details>
      <summary>자세한 이유 (관리자용)</summary>
      <ul>{errs.map((e, i) => <li key={i}>{e.label}: {e.detail}</li>)}</ul>
    </details>
  )
}

// 상태 안내 상자: 불러오는 중 / 오류(빨강) / 저장된 데이터(파랑) / 연습 모드(노랑)
export default function Status({ status, text, mode, errs, fetchedLabel, onRetry }) {
  let kind = '', body = null
  if (status === 'loading') {
    body = <><span className="spin" aria-hidden="true" /><b>{text}</b></>
  } else if (status === 'error') {
    kind = 'err'
    body = (
      <>
        <b>{VISITOR_MESSAGE}</b>
        <p>계속 안 되면 관리자에게 알려 주세요.</p>
        <AdminDetails errs={errs} />
        <button type="button" onClick={onRetry}>다시 시도</button>
      </>
    )
  } else if (mode === 'snapshot') {
    kind = 'note'
    body = (
      <>
        <b>저장된 데이터</b> · 실시간 연결에 실패해 <b>마지막으로 성공한 데이터</b>({fetchedLabel})를 보여 드리고 있어요. 최신 내용과 다를 수 있어요.
        <AdminDetails errs={errs} />
        <button type="button" onClick={onRetry}>실시간으로 다시 시도</button>
      </>
    )
  } else if (mode === 'sample') {
    kind = 'warn'
    body = (
      <>
        <b>연습 모드</b> · 실시간 연결과 저장된 데이터가 모두 없어 <b>1단계 파일 데이터</b>(2022-12-09 기준)로 보여 드리고 있어요. 최신 데이터가 아닐 수 있어요.
        <AdminDetails errs={errs} />
        <button type="button" onClick={onRetry}>실시간으로 다시 시도</button>
      </>
    )
  }
  return (
    <div className={`status ${kind}`} role="status" aria-live="polite" aria-busy={status === 'loading'}>
      {body && <div>{body}</div>}
    </div>
  )
}
