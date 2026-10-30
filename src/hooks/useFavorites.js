import { useCallback, useState } from 'react'
import { lsGet, lsSet } from '../lib/storage.js'

const KEY = 'jeju-fav-v1'

// 관심 장소(★): 브라우저에 저장해 다시 열어도 유지한다
export function useFavorites() {
  const [favs, setFavs] = useState(() => {
    try { return new Set(JSON.parse(lsGet(KEY) || '[]').filter(Number.isFinite)) } catch { return new Set() }
  })
  const toggle = useCallback((id) => {
    setFavs((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      lsSet(KEY, JSON.stringify([...next]))
      return next
    })
  }, [])
  return [favs, toggle]
}
