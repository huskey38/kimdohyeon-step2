// 방문자에게는 쉬운 문구만 보이고, 원인(detail)은 접힌 "관리자용" 영역에만 둔다.
export const VISITOR_MESSAGE = '데이터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'

class LoadError extends Error {
  constructor(message, code, detail) {
    super(message)
    this.code = code
    this.detail = detail
  }
}

async function getJson(url) {
  let res
  try {
    res = await fetch(url)
  } catch {
    throw new LoadError(VISITOR_MESSAGE, 'SERVER_DOWN', '조회 서버에 연결하지 못했습니다. 서버(npm run dev 또는 npm start)가 실행 중인지 확인하세요.')
  }
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new LoadError(body?.error || VISITOR_MESSAGE, body?.code || `HTTP_${res.status}`, body?.detail || `요청에 실패했습니다. (HTTP ${res.status})`)
  return body
}

// 일반정보·위치정보를 같은 경로에서 함께 가져온다. 실패한 쪽은 errs 에 모은다.
async function fetchPair(prefix) {
  const [info, loc] = await Promise.allSettled([getJson(`${prefix}/info`), getJson(`${prefix}/location`)])
  const errs = []
  if (info.status === 'rejected') errs.push({ label: `일반정보(${prefix})`, detail: info.reason.detail || info.reason.message })
  if (loc.status === 'rejected') errs.push({ label: `위치정보(${prefix})`, detail: loc.reason.detail || loc.reason.message })
  return { info: info.value, loc: loc.value, errs }
}

// 데이터 찾기 순서: ① 실시간 API → ② 마지막으로 성공한 응답 → ③ 1단계 파일 데이터(연습 모드)
// 한쪽 API 만 실패해도 두 데이터가 어긋나지 않도록 항상 같은 단계에서 둘 다 가져온다.
// 모두 실패하면 errs 를 담은 오류를 던진다.
export async function loadPlaces(onStep) {
  onStep('불러오는 중이에요… 일반정보·위치정보를 가져오고 있어요')
  const live = await fetchPair('/api')
  if (!live.errs.length) return { mode: 'live', info: live.info, loc: live.loc, errs: [] }

  onStep('실시간 연결에 실패했어요. 마지막으로 성공한 데이터를 확인하는 중이에요…')
  const last = await fetchPair('/api/last')
  if (!last.errs.length) return { mode: 'snapshot', info: last.info, loc: last.loc, errs: live.errs }

  onStep('저장된 데이터가 없어요. 1단계 파일 데이터를 불러오는 중이에요…')
  const file = await fetchPair('/api/sample')
  const tried = [...live.errs, ...last.errs]
  if (file.errs.length) {
    const err = new Error('모든 데이터 경로가 실패했습니다.')
    err.errs = [...tried, ...file.errs]
    throw err
  }
  return { mode: 'sample', info: file.info, loc: file.loc, errs: tried }
}
