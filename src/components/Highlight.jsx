// 검색어와 같은 글자를 노란색으로 강조한다. (React 가 글자를 자동으로 이스케이프하므로 안전하다)
export default function Highlight({ text, q }) {
  const t = String(text ?? ''), needle = q.trim()
  if (!needle) return t
  const lt = t.toLowerCase(), lq = needle.toLowerCase()
  if (lt.length !== t.length) return t
  const parts = []
  let i = 0
  for (let j; (j = lt.indexOf(lq, i)) !== -1; i = j + lq.length) {
    parts.push(t.slice(i, j), <mark key={j}>{t.slice(j, j + lq.length)}</mark>)
  }
  parts.push(t.slice(i))
  return parts
}
