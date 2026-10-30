import { useState } from 'react'
import { lsGet, lsSet } from '../lib/storage.js'

const KEY = 'jeju-howto-closed'

// 이용 방법 · 용어 설명 · 데이터 안내. 접은 상태는 브라우저에 기억한다.
export default function HowTo() {
  const [open, setOpen] = useState(() => lsGet(KEY) !== '1')
  return (
    <div className="howto">
      <details open={open} onToggle={(e) => { setOpen(e.currentTarget.open); lsSet(KEY, e.currentTarget.open ? '0' : '1') }}>
        <summary>이용 방법 · 용어 설명 · 데이터 안내</summary>
        <ol className="steps">
          <li><b>찾기</b> — 검색창에 장소 이름이나 키워드를 입력하고, 분류·디렉토리·지역으로 좁혀 보세요.</li>
          <li><b>고르기</b> — 목록의 장소나 지도의 핀을 누르면 설명이 열리고, 오른쪽(모바일은 전체 화면)에 자세한 정보가 나와요.</li>
          <li><b>모으기</b> — ☆를 눌러 관심 장소를 저장하고, 현재 목록은 CSV로 내려받을 수 있어요.</li>
        </ol>
        <dl className="terms">
          <dt>분류</dt><dd>자료가 속한 큰 갈래예요. (민속 / 확장분야)</dd>
          <dt>디렉토리</dt><dd>자료를 주제별로 나눈 목록이에요. (예: 자연, 사회, 역사)</dd>
          <dt>자료 제목</dt><dd>이 장소와 연결된 자료(보고서·도서 등)의 제목이에요. 장소 이름과 다를 수 있어요.</dd>
          <dt>지역</dt><dd>주소에서 가려낸 제주시 / 서귀포시예요.</dd>
        </dl>
        <p className="data-note">
          📌 공공데이터 <b>2022-12-09 기준</b> 자료예요. 운영 시간·입장료·주차 정보는 이 데이터에 없으니, 방문 전에 꼭 따로 확인해 주세요.
        </p>
      </details>
    </div>
  )
}
