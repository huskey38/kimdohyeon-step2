import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadPlaces } from '../lib/api.js'
import { mergeRows } from '../lib/data.js'

// 데이터 불러오기. status: 'loading' | 'ready' | 'error'
// ready 일 때 mode 는 live(실시간) / snapshot(마지막 성공 응답) / sample(1단계 파일 = 연습 모드)
export function usePlaces() {
  const [result, setResult] = useState({ status: 'loading', text: '불러오는 중이에요…', mode: 'live', errs: [], info: null, loc: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    const onStep = (text) => { if (!cancelled) setResult((r) => ({ ...r, status: 'loading', text })) }
    loadPlaces(onStep)
      .then((res) => { if (!cancelled) setResult({ status: 'ready', text: '', ...res }) })
      .catch((err) => { if (!cancelled) setResult((r) => ({ ...r, status: 'error', errs: err.errs || [{ label: '오류', detail: err.message }] })) })
    return () => { cancelled = true }
  }, [attempt])

  const retry = useCallback(() => setAttempt((a) => a + 1), [])
  const places = useMemo(
    () => (result.info && result.loc && result.status === 'ready' ? mergeRows(result.info.data, result.loc.data) : []),
    [result.info, result.loc, result.status],
  )
  return { ...result, places, retry }
}
