/** 구간별 매물 수가 표시된 파란 원형 클러스터 아이콘 */
export function createClusterIcon(count: number): google.maps.Icon {
  const size = count >= 10 ? 52 : count >= 5 ? 46 : 40;
  const fontSize = count >= 10 ? 15 : 14;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="#3B82F6" fill-opacity="0.88"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 6}" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="2"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" fill="#ffffff" font-size="${fontSize}" font-weight="700" font-family="Pretendard, sans-serif">${count}</text>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
  };
}
