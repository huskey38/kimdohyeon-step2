// 브라우저 저장소가 막힌 환경에서도 화면이 멈추지 않도록 모두 try/catch 로 감싼다
export const lsGet = (k) => {
  try { return localStorage.getItem(k) } catch { return null }
}
export const lsSet = (k, v) => {
  try { localStorage.setItem(k, v) } catch { /* 저장이 막힌 환경이면 무시 */ }
}
