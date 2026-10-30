export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

export const safeUrl = (u) => (/^https?:\/\//i.test(u || '') ? u : '')

// 비어 있거나 "해당없음" 같은 값은 화면에서 숨기도록 빈 문자열로 바꾼다
export const clean = (v) => {
  const s = v == null ? '' : String(v).trim()
  return s && s !== '해당없음' && !s.startsWith('기타(해당사항') ? s : ''
}
