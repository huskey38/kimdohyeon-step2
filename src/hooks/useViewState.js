import { useCallback, useEffect, useState } from 'react'
import { readHash, writeHash } from '../lib/hash.js'

// 검색·필터·정렬·선택 상태. 주소(#)와 항상 맞춰 두어, 새로고침·공유·뒤로가기에서 그대로 복원된다.
export function useViewState() {
  const [view, setView] = useState(readHash)

  // 주소를 직접 고치거나 뒤로가기를 눌렀을 때
  useEffect(() => {
    const onHashChange = () => setView(readHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => { writeHash(view) }, [view])

  const patch = useCallback((p) => setView((v) => ({ ...v, ...(typeof p === 'function' ? p(v) : p) })), [])
  return [view, patch]
}
