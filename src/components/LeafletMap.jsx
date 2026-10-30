import { useEffect, useRef } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { esc } from '../lib/text.js'

const TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'

function popupHtml(d, isFav) {
  const raw = d.content || d.abstract || d.title || ''
  const desc = raw.length > 120 ? raw.slice(0, 120) + '…' : raw
  return `<div class="pop"><h4>${esc(d.name)}</h4><span class="tag">${esc(d.cat)}${d.d1 ? ' · ' + esc(d.d1) : ''}</span>
    ${d.title ? `<p><b>${esc(d.title)}</b></p>` : ''}${desc ? `<p>${esc(desc)}</p>` : ''}
    <div class="addr">📍 ${esc(d.addr)}</div>
    <div class="prow"><button type="button" data-pfav="${d.id}">${isFav ? '★ 관심 해제' : '☆ 관심 저장'}</button><button type="button" data-pdetail="${d.id}">자세히 보기</button></div></div>`
}

// 분류를 색뿐 아니라 모양(● 민속, ◆ 확장분야)으로도 구분한다
function iconFor(d, isFav) {
  const folk = d.cat === '민속'
  return L.divIcon({
    className: 'pin-wrap',
    html: `<span class="pin" style="background:${folk ? '#d9622b' : '#1f6f8f'}"><span class="g" aria-hidden="true">${folk ? '●' : '◆'}</span></span>${isFav ? '<span class="favb" aria-hidden="true">★</span>' : ''}`,
    iconSize: [26, 26], iconAnchor: [13, 30], popupAnchor: [0, -30],
  })
}

// 말풍선 안의 버튼 연결 (말풍선 내용을 바꿀 때마다 다시 호출해야 한다)
function wirePopup(popup, cb) {
  const el = popup.getElement()
  el?.querySelector('[data-pfav]')?.addEventListener('click', (e) => cb.current.onToggleFav(Number(e.currentTarget.dataset.pfav)))
  el?.querySelector('[data-pdetail]')?.addEventListener('click', (e) => cb.current.onOpenDetail(Number(e.currentTarget.dataset.pdetail)))
}

// 실제 지도(Leaflet)에 핀을 올린다. 지도 객체는 React 밖에서 만들어 effect 로 화면 상태와 맞춘다.
export default function LeafletMap({ places, rows, selectedId, favs, focus, fitKey, onMarkerSelect, onToggleFav, onOpenDetail, onOffline }) {
  const elRef = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)
  const markersRef = useRef(new Map())
  const cb = useRef({})
  const rowIds = rows.map((d) => d.id).join(',') // 목록이 실제로 바뀔 때만 핀을 다시 올리기 위한 키

  useEffect(() => { cb.current = { onMarkerSelect, onToggleFav, onOpenDetail, onOffline } })

  // 1. 지도 만들기 (인터넷이 없어 지도 타일이 계속 실패하면 간단 지도로 바꾸도록 알린다)
  useEffect(() => {
    const map = L.map(elRef.current)
    let errors = 0, loaded = false
    L.tileLayer(TILE_URL, {
      attribution: 'Tiles © Esri — Esri, HERE, Garmin, OpenStreetMap contributors', maxZoom: 19,
    })
      .on('tileload', () => { loaded = true })
      .on('tileerror', () => { errors += 1; if (!loaded && errors >= 4) cb.current.onOffline() })
      .addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    map.on('popupopen', (e) => wirePopup(e.popup, cb))
    map.setView([33.38, 126.55], 9)
    mapRef.current = map
    const t = setTimeout(() => map.invalidateSize(), 0)
    const markers = markersRef.current
    return () => { clearTimeout(t); map.remove(); mapRef.current = null; layerRef.current = null; markers.clear() }
  }, [])

  // 2. 장소가 바뀌면 핀을 새로 만든다 (키보드: Tab 으로 이동, Enter 로 말풍선 열기)
  useEffect(() => {
    const markers = markersRef.current
    markers.clear()
    places.filter((d) => d.hasCoord).forEach((d) => {
      const m = L.marker([d.lat, d.lon], { icon: iconFor(d, favs.has(d.id)), title: d.name, alt: d.name, keyboard: true })
      m.bindPopup(popupHtml(d, favs.has(d.id)), { maxWidth: 300 })
      m.on('click', () => cb.current.onMarkerSelect(d.id))
      markers.set(d.id, m)
    })
  }, [places]) // eslint-disable-line -- favs 는 아래 effect 가 따로 반영한다

  // 3. 검색·필터 결과에 해당하는 핀만 지도에 올린다
  useEffect(() => {
    const layer = layerRef.current
    layer.clearLayers()
    rows.forEach((d) => { const m = markersRef.current.get(d.id); if (m) layer.addLayer(m) })
  }, [places, rowIds]) // eslint-disable-line -- rows 는 rowIds 로 대신 비교한다

  // 4. 관심 장소가 바뀌면 핀의 ★ 표시와 열려 있는 말풍선을 갱신한다
  useEffect(() => {
    const byId = new Map(places.map((d) => [d.id, d]))
    markersRef.current.forEach((m, id) => {
      const d = byId.get(id)
      m.setIcon(iconFor(d, favs.has(id)))
      if (m.isPopupOpen()) { m.setPopupContent(popupHtml(d, favs.has(id))); wirePopup(m.getPopup(), cb) }
    })
  }, [favs, places])

  // 5. 선택된 핀을 강조한다 (핀 그림이 바뀐 뒤에 해야 하므로 4번 다음에 둔다)
  useEffect(() => {
    markersRef.current.forEach((m, id) => {
      m.getElement()?.classList.toggle('sel', id === selectedId)
      m.setZIndexOffset(id === selectedId ? 1000 : 0)
    })
  }, [selectedId, places, rowIds, favs])

  // 6. 검색·필터가 바뀌면 결과가 한눈에 보이도록 지도를 맞춘다
  useEffect(() => {
    const pts = rows.filter((d) => d.hasCoord).map((d) => [d.lat, d.lon])
    if (pts.length) mapRef.current.fitBounds(L.latLngBounds(pts).pad(0.15), { maxZoom: 14 })
  }, [fitKey, places]) // eslint-disable-line -- rows 는 fitKey(필터 값)에 따라 정해진다

  // 7. 목록에서 장소를 고르면 그 핀으로 이동하고 말풍선을 연다
  useEffect(() => {
    if (!focus) return
    const m = markersRef.current.get(focus.id)
    if (!m) return
    mapRef.current.setView(m.getLatLng(), Math.max(mapRef.current.getZoom(), 13))
    m.openPopup()
  }, [focus])

  return <div className="lmap" ref={elRef} />
}
