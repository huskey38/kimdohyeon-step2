// 제주 역사문화 조회: 공공데이터포털(odcloud) API 중계 (외부 패키지 없음, Node 20.12 이상)
// vite.config.js 의 플러그인이 개발 서버·미리보기 서버에 이 미들웨어를 붙인다.
//
// 인증키는 이 서버의 환경변수에서만 읽고 브라우저로는 절대 내려보내지 않는다.
//   JEJU_CULTURE_INFO_KEY      제주역사문화 일반정보 API 인증키
//   JEJU_CULTURE_LOCATION_KEY  제주역사문화 위치정보 API 인증키
// 프로젝트 폴더의 .env.local 파일이 있으면 읽는다. (이미 설정된 환경변수가 우선)
//
// 화면이 쓰는 데이터 경로 (앞에서부터 차례로 시도)
//   /api/{info|location}         실시간 API (성공하면 서버에 1시간 보관하고, 마지막 성공 응답을 파일로도 저장)
//   /api/last/{info|location}    마지막으로 성공한 API 응답 (.cache 폴더, 서버를 껐다 켜도 남는다)
//   /api/sample/{info|location}  1단계 CSV 파일 데이터 (연습 모드)
import fs from 'node:fs/promises'

try {
  process.loadEnvFile(new URL('../.env.local', import.meta.url))
} catch (e) {
  if (e.code !== 'ENOENT') console.warn('.env.local 을 읽지 못했습니다:', e.message)
}

const API_BASE = process.env.JEJU_CULTURE_API_BASE || 'https://api.odcloud.kr/api'
const CACHE_MS = 60 * 60 * 1000
const MAX_PAGES = 20
const PER_PAGE = 1000
const ROOT = new URL('../', import.meta.url)
const SNAP_DIR = new URL('.cache/', ROOT)

// 공공데이터포털 파일데이터 -> OpenAPI 자동 변환 서비스 (데이터 기준일 2022-12-09)
const SOURCES = {
  info: { envKey: 'JEJU_CULTURE_INFO_KEY', path: '/15109587/v1/uddi:56c2b3a4-4b4b-46cd-a1fa-f928ef731ffb', label: '일반정보' },
  location: { envKey: 'JEJU_CULTURE_LOCATION_KEY', path: '/15109570/v1/uddi:8781448b-81a8-487c-bc95-d26335bafa82', label: '위치정보' },
}

// 오류는 방문자에게 보여 줄 문구(message)와 관리자용 상세(detail)를 나눠 담는다.
// 상세는 서버 로그(콘솔)에도 남기고, 화면에서는 접힌 "관리자용" 영역에만 보인다.
const VISITOR_MESSAGE = '데이터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'
class ApiError extends Error {
  constructor(status, code, detail, message = VISITOR_MESSAGE) {
    super(message)
    this.status = status
    this.code = code // KEY_MISSING | AUTH | NETWORK | BAD_RESPONSE | NO_SNAPSHOT | NO_FILE
    this.detail = detail
  }
}

// Encoding/Decoding 키 어느 쪽을 넣어도 한 번만 인코딩되도록 정규화
function normalizeKey(key) {
  try { return encodeURIComponent(decodeURIComponent(key)) } catch { return encodeURIComponent(key) }
}

async function fetchPage(src, key, page) {
  const url = `${API_BASE}${src.path}?page=${page}&perPage=${PER_PAGE}&returnType=JSON&serviceKey=${normalizeKey(key)}`
  let res
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(15000) })
  } catch {
    // 오류 메시지에 요청 주소(=키)가 섞이지 않도록 직접 만든 문구만 쓴다
    throw new ApiError(502, 'NETWORK', `${src.label} API 서버에 연결하지 못했습니다. 네트워크를 확인하세요.`)
  }
  const text = await res.text()
  if (res.status === 401 || res.status === 403) {
    throw new ApiError(502, 'AUTH', `${src.label} API 인증에 실패했습니다. ${src.envKey} 값이 맞는지, 공공데이터포털에서 활용신청이 승인됐는지 확인하세요.`)
  }
  let json
  try { json = JSON.parse(text) } catch { json = null }
  if (!res.ok || !json || !Array.isArray(json.data)) {
    // 인증 오류가 JSON 이 아닌 XML 로 내려오는 경우도 있다
    throw new ApiError(502, 'BAD_RESPONSE', `${src.label} API 응답이 올바르지 않습니다. (HTTP ${res.status}) 인증키와 활용신청 상태를 확인하세요.`)
  }
  return json
}

// ---- 실시간 API (+ 마지막 성공 응답 저장) -----------------------------------------
const cache = new Map()
async function loadAll(name) {
  const src = SOURCES[name]
  const key = (process.env[src.envKey] || '').trim()
  if (!key) throw new ApiError(500, 'KEY_MISSING', `${src.envKey} 환경변수가 설정되지 않았습니다.`)

  const hit = cache.get(name)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.body

  const rows = []
  let total = Infinity
  for (let page = 1; rows.length < total && page <= MAX_PAGES; page++) {
    const json = await fetchPage(src, key, page)
    total = Number(json.totalCount) || 0
    if (!json.data.length) break
    rows.push(...json.data)
  }
  const body = JSON.stringify({ source: src.label, mode: 'live', totalCount: total === Infinity ? rows.length : total, fetchedAt: new Date().toISOString(), data: rows })
  cache.set(name, { at: Date.now(), body })
  saveSnapshot(name, body)
  return body
}

// 마지막으로 성공한 응답을 파일로 남겨 두었다가, API 가 실패하면 대신 보여 준다.
async function saveSnapshot(name, body) {
  try {
    await fs.mkdir(SNAP_DIR, { recursive: true })
    await fs.writeFile(new URL(`last-${name}.json`, SNAP_DIR), body)
  } catch (e) {
    console.warn(`마지막 성공 응답(${name})을 저장하지 못했습니다:`, e.message)
  }
}
async function loadSnapshot(name) {
  let text
  try {
    text = await fs.readFile(new URL(`last-${name}.json`, SNAP_DIR), 'utf8')
  } catch {
    throw new ApiError(404, 'NO_SNAPSHOT', `${SOURCES[name].label}의 마지막 성공 응답이 아직 저장되지 않았습니다.`)
  }
  const json = JSON.parse(text)
  json.mode = 'snapshot' // 원래 조회 시각(fetchedAt)은 그대로 둔다
  return JSON.stringify(json)
}

// ---- 연습 모드용: 1단계 CSV 파일 데이터 -------------------------------------------
// 프로젝트 폴더의 CSV(파일명에 '일반정보' / '위치정보' 포함)를 읽어 API 와 같은 모양으로 돌려준다. 키는 필요 없다.
function parseCsv(text) {
  const rows = []
  let row = [], field = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else quoted = false } else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c !== '\r') field += c
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows.filter((r) => r.some((x) => x !== ''))
}
// 공공데이터 CSV 는 보통 CP949(EUC-KR)라서 UTF-8 로 읽히지 않으면 EUC-KR 로 읽는다
const decodeCsv = (buf) => {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(buf) } catch { return new TextDecoder('euc-kr').decode(buf) }
}
const sampleCache = new Map()
async function loadSample(name) {
  if (sampleCache.has(name)) return sampleCache.get(name)
  const label = SOURCES[name].label
  const file = (await fs.readdir(ROOT)).find((f) => f.toLowerCase().endsWith('.csv') && f.includes(label))
  if (!file) throw new ApiError(404, 'NO_FILE', `${label} CSV 파일을 찾지 못했습니다.`)
  const [head, ...body] = parseCsv(decodeCsv(await fs.readFile(new URL(file, ROOT))).replace(/^﻿/, ''))
  const keys = head.map((h) => h.trim())
  const data = body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])))
  const out = JSON.stringify({ source: `${label}(파일)`, mode: 'sample', totalCount: data.length, fetchedAt: new Date().toISOString(), data })
  sampleCache.set(name, out)
  return out
}

const send = (res, status, type, body, extra = {}) => {
  res.writeHead(status, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', ...extra })
  res.end(body)
}

// Vite 의 미들웨어(connect 방식): /api/ 로 시작하는 요청만 처리하고 나머지는 Vite 에 넘긴다.
export async function apiMiddleware(req, res, next) {
  const { pathname } = new URL(req.url, 'http://localhost')
  if (!pathname.startsWith('/api/')) return next()
  if (req.method !== 'GET') return send(res, 405, 'text/plain; charset=utf-8', 'Method Not Allowed')

  const m = pathname.match(/^\/api\/(sample\/|last\/)?(info|location)$/)
  if (!m) return send(res, 404, 'text/plain; charset=utf-8', 'Not Found')
  try {
    const loader = m[1] === 'sample/' ? loadSample : m[1] === 'last/' ? loadSnapshot : loadAll
    return send(res, 200, 'application/json; charset=utf-8', await loader(m[2]), { 'Cache-Control': 'no-store' })
  } catch (e) {
    const known = e instanceof ApiError
    if (known) console.warn(`[${new Date().toLocaleString('ko-KR')}] ${pathname} 실패 (${e.code}): ${e.detail}`)
    else console.error(e)
    const payload = known
      ? { error: e.message, code: e.code, detail: e.detail }
      : { error: VISITOR_MESSAGE, code: 'INTERNAL', detail: '서버 내부 오류가 발생했습니다. 서버 로그를 확인하세요.' }
    return send(res, known ? e.status : 500, 'application/json; charset=utf-8', JSON.stringify(payload), { 'Cache-Control': 'no-store' })
  }
}

// 서버가 켜질 때 데이터를 미리 받아 두어, 첫 방문자가 API 응답을 기다리지 않게 한다.
export function prewarm() {
  const keys = Object.values(SOURCES).map((s) => `${s.envKey}: ${process.env[s.envKey] ? '설정됨' : '없음'}`).join(' · ')
  console.log(keys)
  for (const name of Object.keys(SOURCES)) {
    if (!(process.env[SOURCES[name].envKey] || '').trim()) continue
    loadAll(name)
      .then(() => console.log(`미리 불러오기 완료: ${SOURCES[name].label}`))
      .catch((e) => console.warn(`미리 불러오기 실패: ${SOURCES[name].label} (${e.code || 'ERROR'}) ${e.detail || e.message}`))
  }
}
