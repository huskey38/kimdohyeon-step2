import { useState } from 'react'
import { safeUrl } from '../lib/text.js'

const FOLD_AT = 260

// 긴 글은 처음 260자만 보이고 "더 보기"로 펼친다
function LongText({ label, text }) {
  const [open, setOpen] = useState(false)
  if (!text) return null
  const long = text.length > FOLD_AT
  const shown = !long || open ? text : text.slice(0, FOLD_AT).replace(/\s+\S*$/, '') + '…'
  return (
    <>
      <h3>{label}</h3>
      <div className="text">{shown}</div>
      {long && (
        <button type="button" className="more" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? '접기' : `더 보기 (전체 ${text.length.toLocaleString('ko-KR')}자)`}
        </button>
      )}
    </>
  )
}

const Row = ({ k, v }) => (v ? <><dt>{k}</dt><dd>{v}</dd></> : null)

function PlaceDetail({ place: d, isFav, onToggleFav, onBack }) {
  const [copied, setCopied] = useState(false)
  const link = safeUrl(d.link), n = encodeURIComponent(d.name)
  const copy = async () => {
    try { await navigator.clipboard.writeText(location.href); setCopied(true) } catch { window.prompt('이 주소를 복사하세요', location.href) }
  }
  return (
    <>
      <button type="button" className="back" onClick={onBack}>← 목록으로</button>
      <div className="dhead">
        <h2>{d.name}</h2>
        <button type="button" aria-pressed={isFav} onClick={() => onToggleFav(d.id)}>{isFav ? '★ 관심 해제' : '☆ 관심 저장'}</button>
      </div>
      <span className="tag">{d.cat}{d.d1 ? ` · ${d.d1}` : ''}{d.d2 ? ` · ${d.d2}` : ''}</span>
      {d.title && <div className="ttl">{d.title}</div>}
      {d.sub && <div className="sub">{d.sub}</div>}
      <dl className="info">
        <Row k="주소" v={d.addr} /><Row k="우편번호" v={d.zip} />
        {d.hasCoord && <Row k="좌표" v={`${d.lat}, ${d.lon} (${d.crs})`} />}
        <Row k="저작자" v={d.author} /><Row k="발행자" v={d.publisher} /><Row k="발행일" v={d.pubdate} />
        <Row k="자료유형" v={d.type} /><Row k="자료형태" v={d.form} /><Row k="언어" v={d.lang} /><Row k="범위" v={d.scope} />
        <Row k="주제" v={d.subject} /><Row k="출처" v={d.source} /><Row k="기여자" v={d.contributor} />
        <Row k="고유번호" v={String(d.id)} /><Row k="기준일" v={d.date} />
      </dl>
      <LongText label="초록" text={d.abstract} />
      <LongText label="내용" text={d.content} />
      <LongText label="목차" text={d.toc} />
      <LongText label="참고문헌" text={d.ref} />
      <div className="links">
        {d.hasCoord && (
          <>
            <a className="btn alt" href={`https://map.kakao.com/link/to/${n},${d.lat},${d.lon}`} target="_blank" rel="noopener noreferrer">카카오맵 길찾기</a>
            <a className="btn alt" href={`https://www.google.com/maps/dir/?api=1&destination=${d.lat},${d.lon}`} target="_blank" rel="noopener noreferrer">구글 지도 길찾기</a>
          </>
        )}
        <a className="btn alt" href={`https://map.naver.com/p/search/${n}`} target="_blank" rel="noopener noreferrer">네이버 지도에서 검색</a>
        {link && <a className="btn" href={link} target="_blank" rel="noopener noreferrer">제주 문화 디렉토리 원문</a>}
        <button type="button" onClick={copy}>{copied ? '✔ 복사했어요' : '🔗 이 장소 링크 복사'}</button>
      </div>
      <div className="limits">
        ℹ️ 공개 데이터(2022-12-09 기준)라 현장과 다를 수 있어요. <b>자료 제목</b>은 장소와 직접 관련 없는 보고서 이름일 수 있고, <b>좌표</b>는 대표 지점일 수 있어요. 운영 시간·입장료·주차 정보는 이 데이터에 없으니 방문 전에 따로 확인해 주세요.
      </div>
    </>
  )
}

// 상세 패널. 모바일에서는 open 일 때 전체 화면 시트가 된다. 장소가 바뀌면 key 로 접힘 상태가 초기화된다.
export default function DetailPanel({ place, isFav, open, onToggleFav, onBack, ref }) {
  return (
    <section ref={ref} className={`card detail${open ? ' open' : ''}`} aria-label="장소 상세 정보">
      {place
        ? <PlaceDetail key={place.id} place={place} isFav={isFav} onToggleFav={onToggleFav} onBack={onBack} />
        : (
          <>
            <button type="button" className="back" onClick={onBack}>← 목록으로</button>
            <div className="empty">목록의 장소나 지도의 핀을 선택하면<br />자세한 정보가 여기에 표시돼요.</div>
          </>
        )}
    </section>
  )
}
