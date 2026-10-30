# 제주 역사문화 장소 찾기 (Vite + React)

공공데이터포털의 제주역사문화 **일반정보**·**위치정보** API를 서버가 호출하고, 화면(React)은 그 서버만 부른다.
인증키는 환경변수로만 읽으며 화면 코드·응답에 들어가지 않는다.

## 실행

1. Node.js 20.12 이상 설치, `npm install`
2. `.env.example` 을 복사해 `.env.local` 을 만들고 키를 채운다. (또는 같은 이름의 시스템 환경변수 — 시스템 환경변수가 우선)

   | 환경변수 | API |
   |---|---|
   | `JEJU_CULTURE_INFO_KEY` | 제주특별자치도_제주역사문화일반정보 (데이터 15109587) |
   | `JEJU_CULTURE_LOCATION_KEY` | 제주특별자치도_제주역사문화위치정보 (데이터 15109570) |

3. 실행 — 둘 다 http://localhost:3000 에서 열린다. (포트는 `PORT` 환경변수로 변경, 이미 쓰이는 포트면 다른 포트로 넘어가지 않고 멈춰서 알려 준다)

   | 명령 | 하는 일 |
   |---|---|
   | `npm run dev` | 개발 서버. 코드를 고치면 화면이 바로 바뀐다. |
   | `npm start` | 빌드(`dist/`) 후 미리보기 서버로 실행. |
   | `npm run build` | 빌드만 한다. |
   | `npm run lint` | oxlint 로 코드를 검사한다. |

`.env.local` 을 고친 뒤에는 서버를 **껐다 켜야** 반영된다. (키는 서버가 시작할 때 한 번 읽는다.) 빌드한 `dist/index.html` 을 더블클릭해서 여는 방식은 동작하지 않는다. (키를 화면에 두지 않으려면 서버가 필요하다.)

## 코드 양식

- **Vite 8 + React 19, JavaScript(JSX)**. `index.html`(진입) → `src/main.jsx` → `src/App.jsx` 로 이어지는 Vite 기본 구조이고, 화면은 함수형 컴포넌트와 훅으로 나눴다.
- 스타일은 일반 CSS 두 개 — `src/index.css`(색·기본 요소), `src/App.css`(컴포넌트별 스타일). 지도는 npm 패키지 `leaflet` 을 가져와 쓴다.
- **API 서버는 별도 프로세스가 아니라 Vite 플러그인**이다. `vite.config.js` 가 `server/api.mjs` 의 미들웨어를 개발 서버·미리보기 서버에 붙여서 `/api/*` 를 처리한다. 그래서 키는 Vite 를 실행하는 서버 쪽에만 있고 브라우저 번들에는 들어가지 않는다. (`VITE_` 접두사를 붙이지 않는다.)
- 화면 상태(검색·필터·정렬·선택)는 주소(`#q=한라&cat=민속&id=521`)와 항상 맞춰 두어 새로고침·공유·뒤로가기에서 복원된다.

## 폴더 구조

```
index.html              Vite 진입 파일 (<div id="root">)
vite.config.js          Vite 설정 + /api 플러그인 연결 + 개발 서버 파일 노출 차단
server/api.mjs          API 중계(키 읽기, 마지막 성공 응답 저장, CSV 대체 데이터)
public/favicon.svg
src/
  main.jsx              React 진입 (StrictMode)
  App.jsx               화면 전체 조립, 선택·시트·지도 이동 흐름
  index.css, App.css    스타일
  components/           Header · HowTo · Status · Skeleton · Toolbar · PlaceTable · Highlight
                        MapPanel · LeafletMap · SvgMap · DetailPanel · Footer
  hooks/                usePlaces(불러오기) · useViewState(주소와 연동된 상태)
                        useFavorites(관심 장소) · useMediaQuery(화면 폭)
  lib/                  api(3단계 불러오기) · data(합치기·필터·정렬) · columns · hash · csv
                        geo(간단 지도 계산) · modes · text · storage
.cache/                 마지막 성공 응답 저장 폴더 (자동 생성, git 제외)
dist/                   빌드 결과 (git 제외)
CSV 2개                 1단계 파일 데이터 (연습 모드용)
```

## 화면 구성

화면(페이지)은 **1개**다. 주소는 `/` 하나뿐이라 화면 이동은 없다. 한 화면 안에 아래 영역이 있고, 데이터 상태에 따라 보이는 영역이 달라진다.

| # | 영역 | 컴포넌트 | 보여 주는 것 |
|---|---|---|---|
| 1 | 머리글 | `Header` | 제목과 한 줄 설명. 실시간이 아닌 데이터일 때는 제목 옆에 `저장된 데이터` 또는 `연습 모드` 배지 |
| 2 | 이용 안내 | `HowTo` | 접고 펼 수 있는 상자(접은 상태는 기억). 이용 방법, 용어 설명, 데이터 기준일과 "운영 시간·입장료·주차 정보 없음" 안내 |
| 3 | 상태 안내 | `Status`, `Skeleton` | 불러오는 중(돌아가는 표시 + 표 모양 뼈대) / 저장된 데이터(파랑) / 연습 모드(노랑) / 오류(빨강). 방문자용 한 줄, `다시 시도` 버튼, 접힌 `자세한 이유 (관리자용)` |
| 4 | 검색·필터 | `Toolbar` | 검색창, 분류·디렉토리·지역·정렬 선택, `☆ 관심 장소만 보기`, `현재 목록 CSV 내려받기`, `필터 초기화` |
| 5 | 목록 | `PlaceTable`, `Highlight` | 데스크톱은 표, 모바일은 카드 목록. 검색어 강조, 0건 안내, ★ 관심 저장, 열 제목 정렬 |
| 6 | 지도 | `MapPanel` → `LeafletMap` / `SvgMap` | 실제 지도 위의 핀(●민속 / ◆확장분야 / ★관심)과 말풍선. 인터넷이 없으면 윤곽·지역 이름이 있는 간단 지도로 자동 전환 |
| 7 | 상세 패널 | `DetailPanel` | 두 API 정보를 합친 상세. 긴 글 접기, 관심 저장, 길찾기 링크, 원문·링크 복사, 데이터 한계 안내. 모바일은 전체 화면 시트 |

화면 맨 아래 `Footer` 에는 불러온 건수와 데이터 출처(서버 조회 시각 / 마지막 성공 조회 시각 / 파일 데이터 기준일)가 나온다.

| 상태 | 보이는 영역 |
|---|---|
| 불러오는 중 | 1, 2, 3(로딩 표시 + 뼈대 화면) |
| 정상 (실시간 API) | 1, 2, 4, 5, 6, 7 + 바닥글 |
| 저장된 데이터 (API 실패 → 마지막 성공 응답) | 정상과 같은 화면 + 1(파란 배지), 3(파란 안내) |
| 연습 모드 (저장된 데이터도 없음 → 1단계 파일 데이터) | 정상과 같은 화면 + 1(노란 배지), 3(노란 안내) |
| 오류 (세 가지 모두 실패) | 1, 2, 3(빨간 안내) (4~7 숨김) |

**영역 간 연동:** 목록·지도·상세는 같은 선택 상태를 공유한다(`App.jsx`). 목록의 행이나 지도의 핀을 선택하면 둘 다 강조되고 상세가 바뀐다. 검색·필터를 바꾸면 목록과 지도의 핀이 함께 걸러지고, 지도는 결과가 모두 보이도록 맞춰진다.

**데이터 출처별 항목**

| API | 화면에서 쓰는 항목 |
|---|---|
| 위치정보 | 장소명, 위도·경도(지도), 우편번호, 주소(`위치`), 좌표계, 상세보기 URL, 기준일 |
| 일반정보 | 분류, 디렉토리1·2, 제목(화면에서는 "자료 제목"), 부제목, 저작자, 주제, 내용, 초록, 목차, 발행자·발행일, 자료유형·형태, 언어, 범위, 출처, 기여자, 참고문헌, 링크 |

`지역`(제주시/서귀포시)은 API 항목이 아니라 주소에서 판별한 값이다. 위치정보를 기준으로 목록을 만들고(`src/lib/data.js`), 같은 데이터 고유번호의 일반정보를 붙인다.

## 데이터 경로와 장애 대비

화면(`src/lib/api.js`)은 아래 순서로 데이터를 찾고, 앞 단계가 실패하면 다음 단계로 넘어간다. 한쪽 API만 실패해도 두 데이터가 어긋나지 않도록 **일반정보·위치정보를 항상 같은 단계에서** 가져온다.

| 순서 | 경로 | 표시 | 설명 |
|---|---|---|---|
| 1 | `/api/info`, `/api/location` | (표시 없음) | 실시간 API. 성공하면 서버가 1시간 보관하고 `.cache/` 에도 저장한다. 서버가 켜질 때 미리 받아 둔다. |
| 2 | `/api/last/info`, `/api/last/location` | `저장된 데이터` | **마지막으로 성공한 API 응답**(`.cache/`). 서버를 껐다 켜도 남는다. |
| 3 | `/api/sample/info`, `/api/sample/location` | `연습 모드` | 프로젝트 폴더의 **1단계 CSV 파일 데이터**(2022-12-09 기준). 파일명에 `일반정보` / `위치정보`가 들어 있어야 한다. |
| — | (모두 실패) | 오류 화면 | 방문자용 한 줄 + 접힌 관리자용 상세 |

- 오류는 서버가 **방문자용 문구**(`error`)와 **관리자용 상세**(`detail`, 오류 코드 `code`)로 나눠 보낸다. 상세는 서버 콘솔에도 기록되고 화면에서는 접힌 `자세한 이유 (관리자용)` 안에만 보인다. 오류 코드: `KEY_MISSING` · `AUTH` · `NETWORK` · `BAD_RESPONSE` · `NO_SNAPSHOT` · `NO_FILE` · `INTERNAL`
- 안내 상자의 `다시 시도`를 누르면 1단계부터 다시 시도하고, 성공하면 배지와 안내가 사라진다.
- 키 파일·저장된 응답·서버 코드는 개발 서버에서도 주소로 열리지 않는다(`vite.config.js` 의 `server.fs.deny`). 미리보기 서버는 빌드 결과(`dist/`)만 내보낸다.

## 개선 적용 내역

처음 쓰는 사용자 관점에서 정리했던 10가지 제안을 모두 적용했다. 개선 번호별로 **어느 코드가 담당하는지** 정리한다.

| # | 개선 | 담당 코드 |
|---|---|---|
| 1 | 방문자 말 설명 + 이용 방법 + 기준일 | `components/Header.jsx`(설명 문구, 건수), `components/HowTo.jsx`(이용 방법·기준일, 접힘 상태 기억) |
| 2 | 낯선 용어 도움말 | `HowTo.jsx` 의 용어 설명, `lib/columns.js` 의 `tip`(열 제목 툴팁, "제목"→"자료 제목"), `Toolbar.jsx` 필터 `title` |
| 3 | 로딩 표시 + 미리 받아 두기 | `components/Skeleton.jsx`(표 모양 뼈대), `Status.jsx`(돌아가는 표시·`aria-busy`), `server/api.mjs` 의 `prewarm()` |
| 4 | 지도 배경 + 결과에 맞춘 자동 확대 | `components/LeafletMap.jsx`(핀·말풍선, 필터 변경 시 `fitBounds`), `SvgMap.jsx`+`lib/geo.js`(오프라인 대체: 윤곽·지역 이름), `MapPanel.jsx`(자동 전환) |
| 5 | 검색 강조·0건 안내·주소에 상태 저장 | `components/Highlight.jsx`, `PlaceTable.jsx` 의 `EmptyBox`, `lib/hash.js` + `hooks/useViewState.js` |
| 6 | 모바일 카드 목록 + 목록으로 | `App.css` 의 `@media (max-width: 700px)`(표→카드), `App.jsx` 의 `sheetOpen`(전체 화면 시트, `Esc`), `DetailPanel.jsx` 의 `← 목록으로` |
| 7 | 상세 접기·길찾기·관심 장소·CSV | `DetailPanel.jsx`(`LongText` 접기, 길찾기·링크 복사), `hooks/useFavorites.js` + `PlaceTable.jsx`/`Toolbar.jsx`(관심 장소), `lib/csv.js`(BOM 포함, `= + - @` 시작 값 보호) |
| 8 | 데이터 한계 안내 | `HowTo.jsx` 의 `.data-note`, `DetailPanel.jsx` 하단 `.limits` |
| 9 | 키보드·색각 접근성 | `LeafletMap.jsx`(핀 `keyboard`, ●/◆ 모양), `SvgMap.jsx`(`tabIndex`·`role="button"`·Enter/Space), `PlaceTable.jsx`(머리글 Enter 정렬, `aria-pressed`·`aria-label`) |
| 10 | API 장애 대비 | `server/api.mjs`(`ApiError` 방문자용/관리자용 분리, 마지막 성공 응답 저장, CSV 대체), `lib/api.js`(3단계 순서), `hooks/usePlaces.js`, `Status.jsx`(모드별 안내·관리자용 접힘) |
