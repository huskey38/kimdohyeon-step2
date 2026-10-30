// 간단 지도(SVG)용: 위도·경도를 화면 좌표로 바꾸는 함수와 바깥선(볼록 껍질) 계산

// places 의 좌표 범위에 맞춰 (장소) → [x, y] 를 돌려주는 함수를 만든다
export function makeProject(places) {
  const pts = places.filter((d) => d.hasCoord)
  if (!pts.length) return () => [0, 0]
  const lons = pts.map((d) => d.lon), lats = pts.map((d) => d.lat)
  const lonMin = Math.min(...lons), lonMax = Math.max(...lons)
  const latMin = Math.min(...lats), latMax = Math.max(...lats)
  const k = Math.cos(((latMin + latMax) / 2) * Math.PI / 180) // 위도에 따른 가로 길이 보정
  const W = 600, H = 300, P = 24
  const w = (lonMax - lonMin) * k, h = latMax - latMin
  const s = Math.min(W / w, H / h)
  return (d) => [
    P + ((d.lon - lonMin) * k) * s + (W - w * s) / 2,
    P + (latMax - d.lat) * s + (H - h * s) / 2,
  ]
}

export function convexHull(points) {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const build = (list) => {
    const h = []
    for (const p of list) {
      while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], p) <= 0) h.pop()
      h.push(p)
    }
    return h.slice(0, -1)
  }
  return build(pts).concat(build([...pts].reverse()))
}
