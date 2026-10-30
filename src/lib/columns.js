// 표(목록) 열 정의. tip 은 열 제목 도움말(툴팁), mlabel 은 모바일 카드에서 쓰는 이름
export const COLS = [
  { key: 'fav', label: '★', cls: 'starcell', mlabel: '관심', tip: '관심 장소로 저장', sortable: false },
  { key: 'id', label: '번호', cls: 'num', num: true, tip: '데이터 고유번호' },
  { key: 'name', label: '장소명', cls: 'name' },
  { key: 'cat', label: '분류', tip: '자료가 속한 큰 갈래 (민속 / 확장분야)' },
  { key: 'd1', label: '디렉토리', tip: '자료를 주제별로 나눈 목록' },
  { key: 'title', label: '자료 제목', cls: 'clip', tip: '이 장소와 연결된 자료(보고서·도서 등)의 제목이라 장소 이름과 다를 수 있어요' },
  { key: 'area', label: '지역', tip: '주소에서 가려낸 제주시 / 서귀포시' },
  { key: 'pubdate', label: '발행일', cls: 'num', tip: '자료가 발행된 날짜' },
]

export const SORT_KEYS = ['id', 'name', 'cat', 'd1', 'title', 'area', 'pubdate']

// 정렬 선택 상자의 항목 → [정렬 열, 방향]
export const SORT_PRESETS = {
  name: ['name', 1],
  dateDesc: ['pubdate', -1],
  dateAsc: ['pubdate', 1],
  id: ['id', 1],
}
