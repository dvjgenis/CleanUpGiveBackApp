/** Inline MapLibre GL JS helpers shared by Expo Go WebView map components. */
export function buildWebViewMapHelpers(primaryColor: string, startColor: string) {
  return `
  function smoothRouteForDisplay(coords) {
    if (!coords || coords.length < 3) return coords || [];
    const smoothed = [coords[0]];
    for (let i = 1; i < coords.length - 1; i++) {
      smoothed.push([
        coords[i - 1][0] * 0.25 + coords[i][0] * 0.5 + coords[i + 1][0] * 0.25,
        coords[i - 1][1] * 0.25 + coords[i][1] * 0.5 + coords[i + 1][1] * 0.25,
      ]);
    }
    smoothed.push(coords[coords.length - 1]);
    return smoothed;
  }

  function createStartMarkerElement() {
    const el = document.createElement('div');
    el.style.width = '14px';
    el.style.height = '14px';
    el.style.borderRadius = '7px';
    el.style.backgroundColor = '${startColor}';
    el.style.border = '2px solid #ffffff';
    el.style.boxSizing = 'border-box';
    return el;
  }

  function createArrowMarkerElement(heading) {
    const el = document.createElement('div');
    el.style.width = '28px';
    el.style.height = '28px';
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    if (heading != null && Number.isFinite(heading)) {
      el.style.transform = 'rotate(' + heading + 'deg)';
    }
    el.innerHTML = '<div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:12px solid ${primaryColor};margin-bottom:-2px;"></div><div style="width:6px;height:8px;border-radius:3px;background:${primaryColor};border:1px solid #ffffff;"></div>';
    return el;
  }

  function createEndMarkerElement() {
    const el = document.createElement('div');
    el.style.width = '22px';
    el.style.height = '22px';
    el.style.borderRadius = '11px';
    el.style.backgroundColor = '${primaryColor}';
    el.style.border = '2px solid #ffffff';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.boxSizing = 'border-box';
    el.innerHTML = '<div style="width:8px;height:8px;border-radius:4px;background:#ffffff;"></div>';
    return el;
  }
  `;
}
