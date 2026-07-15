/** Inline MapLibre GL JS helpers shared by Expo Go WebView map components. */
export function buildWebViewMapHelpers(primaryColor: string, startColor: string) {
  return `
  const EARTH_RADIUS_MILES = 3958.8;
  const DISPLAY_SIMPLIFY_TOLERANCE_METERS = 4;

  function toRadians(degrees) {
    return (degrees * Math.PI) / 180;
  }

  function haversineMiles(lat1, lon1, lat2, lon2) {
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const startLat = toRadians(lat1);
    const endLat = toRadians(lat2);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(startLat) * Math.cos(endLat) * Math.sin(dLon / 2) ** 2;
    return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function deltaMetersBetween(from, to) {
    return haversineMiles(from[1], from[0], to[1], to[0]) * 1609.344;
  }

  function computeBearingDegrees(from, to) {
    const lat1 = (from[1] * Math.PI) / 180;
    const lat2 = (to[1] * Math.PI) / 180;
    const dLng = ((to[0] - from[0]) * Math.PI) / 180;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    const bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360;
  }

  function bearingDifferenceDegrees(a, b) {
    const diff = Math.abs(a - b) % 360;
    return diff > 180 ? 360 - diff : diff;
  }

  function isSharpReversal(prevRoutePoint, lastRoutePoint, candidate) {
    const segmentMeters = deltaMetersBetween(lastRoutePoint, candidate);
    if (segmentMeters > 12) return false;
    const inboundBearing = computeBearingDegrees(prevRoutePoint, lastRoutePoint);
    const outboundBearing = computeBearingDegrees(lastRoutePoint, candidate);
    return bearingDifferenceDegrees(inboundBearing, outboundBearing) >= 120;
  }

  function perpendicularDistanceMeters(point, lineStart, lineEnd) {
    const lineLengthMeters = deltaMetersBetween(lineStart, lineEnd);
    if (lineLengthMeters === 0) {
      return deltaMetersBetween(point, lineStart);
    }
    const px = point[0];
    const py = point[1];
    const x1 = lineStart[0];
    const y1 = lineStart[1];
    const x2 = lineEnd[0];
    const y2 = lineEnd[1];
    const t = Math.max(
      0,
      Math.min(
        1,
        ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) /
          ((x2 - x1) ** 2 + (y2 - y1) ** 2),
      ),
    );
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    return deltaMetersBetween(point, [projX, projY]);
  }

  function douglasPeucker(coordinates, toleranceMeters) {
    if (coordinates.length < 3) return coordinates;
    let maxDistance = 0;
    let maxIndex = 0;
    const endIndex = coordinates.length - 1;
    for (let index = 1; index < endIndex; index += 1) {
      const distance = perpendicularDistanceMeters(
        coordinates[index],
        coordinates[0],
        coordinates[endIndex],
      );
      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = index;
      }
    }
    if (maxDistance > toleranceMeters) {
      const left = douglasPeucker(coordinates.slice(0, maxIndex + 1), toleranceMeters);
      const right = douglasPeucker(coordinates.slice(maxIndex), toleranceMeters);
      return left.slice(0, -1).concat(right);
    }
    return [coordinates[0], coordinates[endIndex]];
  }

  function removeDisplayOutliers(coordinates) {
    if (coordinates.length < 3) return coordinates;
    const filtered = [coordinates[0]];
    for (let index = 1; index < coordinates.length - 1; index += 1) {
      const prevRoutePoint = filtered[filtered.length - 1];
      const prevRoutePoint2 = filtered.length >= 2 ? filtered[filtered.length - 2] : null;
      const current = coordinates[index];
      const next = coordinates[index + 1];
      if (prevRoutePoint2 && isSharpReversal(prevRoutePoint2, prevRoutePoint, current)) {
        continue;
      }
      const deviation = perpendicularDistanceMeters(current, prevRoutePoint, next);
      if (deviation > DISPLAY_SIMPLIFY_TOLERANCE_METERS * 2) {
        continue;
      }
      filtered.push(current);
    }
    filtered.push(coordinates[coordinates.length - 1]);
    return filtered;
  }

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

  function simplifyRouteForDisplay(coords) {
    if (!coords || coords.length < 2) return coords || [];
    const withoutOutliers = removeDisplayOutliers(coords);
    const simplified =
      withoutOutliers.length >= 3
        ? douglasPeucker(withoutOutliers, DISPLAY_SIMPLIFY_TOLERANCE_METERS)
        : withoutOutliers;
    return smoothRouteForDisplay(simplified);
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
    el.dataset.heading = heading != null && Number.isFinite(heading) ? String(heading) : '';
    if (heading != null && Number.isFinite(heading)) {
      el.style.transform = 'rotate(' + heading + 'deg)';
    }
    el.innerHTML = '<div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:12px solid ${primaryColor};margin-bottom:-2px;"></div><div style="width:6px;height:8px;border-radius:3px;background:${primaryColor};border:1px solid #ffffff;"></div>';
    return el;
  }

  function updateArrowMarkerElement(el, heading) {
    if (heading != null && Number.isFinite(heading)) {
      el.style.transform = 'rotate(' + heading + 'deg)';
      el.dataset.heading = String(heading);
    }
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
