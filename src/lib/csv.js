const COLUMNS = [
  ['번호', 'id'], ['장소명', 'name'], ['분류', 'cat'], ['디렉토리1', 'd1'], ['디렉토리2', 'd2'], ['자료 제목', 'title'],
  ['지역', 'area'], ['주소', 'addr'], ['위도', 'lat'], ['경도', 'lon'], ['발행일', 'pubdate'], ['링크', 'link'],
]

// 엑셀에서 수식으로 실행되지 않도록 = + - @ 로 시작하는 글자는 앞에 ' 를 붙인다
const cell = (v) => {
  let s = v == null || Number.isNaN(v) ? '' : String(v)
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s
  return '"' + s.replace(/"/g, '""') + '"'
}

// 현재 목록을 CSV 로 내려받는다 (엑셀에서 한글이 깨지지 않도록 BOM 포함)
export function downloadCsv(rows) {
  const lines = [COLUMNS.map((c) => cell(c[0])).join(','), ...rows.map((d) => COLUMNS.map((c) => cell(d[c[1]])).join(','))]
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }))
  a.download = `제주역사문화_${rows.length}건.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
