import { useSyncExternalStore } from 'react'

// 화면 폭 조건(예: '(max-width: 700px)')이 맞는지 알려 준다. 창 크기가 바뀌면 자동으로 갱신된다.
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const mq = matchMedia(query)
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    },
    () => matchMedia(query).matches,
    () => false,
  )
}
