/** Inline MapLibre GL JS helpers shared by Expo Go WebView map components. */
export function buildWebViewMapHelpers(
  primaryColor: string,
  startColor: string,
  startBorderColor = '#ffffff',
) {
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
    el.style.backgroundColor = window.__startMarkerFill || '${startColor}';
    el.style.border = '2px solid ' + (window.__startMarkerBorder || '${startBorderColor}');
    el.style.boxSizing = 'border-box';
    return el;
  }

  function applyStartMarkerColors(fill, border) {
    if (typeof fill === 'string') {
      window.__startMarkerFill = fill;
    }
    if (typeof border === 'string') {
      window.__startMarkerBorder = border;
    }
  }

  function paintStartMarkerElement(el) {
    if (!el) return;
    var fill = window.__startMarkerFill || '${startColor}';
    var border = window.__startMarkerBorder || '${startBorderColor}';
    el.style.backgroundColor = fill;
    el.style.border = '2px solid ' + border;
  }

  var HEADING_MARKER_SIZE = 100;
  var HEADING_MARKER_CENTER = HEADING_MARKER_SIZE / 2;
  var HEADING_DOT_OUTER_RADIUS = 11;
  var HEADING_DOT_INNER_RADIUS = 7;
  // Google Maps-style "location beam": a soft circular sector (pie slice)
  // fanning out from the dot toward the heading direction (matching the
  // native marker in SessionMapMarkers.tsx), built from a flat-opacity
  // sector rather than a gradient/blur fill for visual parity with the
  // native path.
  var HEADING_BEAM_OUTER_RADIUS = 48;
  var HEADING_BEAM_OUTER_HALF_ANGLE_DEG = 34;
  var HEADING_BEAM_OUTER_OPACITY = 0.16;

  // Builds an SVG path "d" string for a circular sector ("pie slice")
  // pointing straight up from (cx, cy), spanning halfAngleDeg on either
  // side of due north, out to radius.
  function buildBeamSectorPath(cx, cy, radius, halfAngleDeg) {
    var halfAngleRad = (halfAngleDeg * Math.PI) / 180;
    var leftX = cx - radius * Math.sin(halfAngleRad);
    var leftY = cy - radius * Math.cos(halfAngleRad);
    var rightX = cx + radius * Math.sin(halfAngleRad);
    var rightY = cy - radius * Math.cos(halfAngleRad);
    return (
      'M ' + cx + ' ' + cy +
      ' L ' + leftX + ' ' + leftY +
      ' A ' + radius + ' ' + radius + ' 0 0 1 ' + rightX + ' ' + rightY +
      ' Z'
    );
  }

  function buildHeadingMarkerSvg(hasHeading) {
    var beam = hasHeading
      ? '<path d="' + buildBeamSectorPath(
          HEADING_MARKER_CENTER,
          HEADING_MARKER_CENTER,
          HEADING_BEAM_OUTER_RADIUS,
          HEADING_BEAM_OUTER_HALF_ANGLE_DEG
        ) + '" fill="${primaryColor}" fill-opacity="' + HEADING_BEAM_OUTER_OPACITY + '"></path>'
      : '';
    return (
      '<svg width="' + HEADING_MARKER_SIZE + '" height="' + HEADING_MARKER_SIZE + '" viewBox="0 0 ' + HEADING_MARKER_SIZE + ' ' + HEADING_MARKER_SIZE + '">' +
      beam +
      '<circle cx="' + HEADING_MARKER_CENTER + '" cy="' + HEADING_MARKER_CENTER + '" r="' + HEADING_DOT_OUTER_RADIUS + '" fill="#ffffff"></circle>' +
      '<circle cx="' + HEADING_MARKER_CENTER + '" cy="' + HEADING_MARKER_CENTER + '" r="' + HEADING_DOT_INNER_RADIUS + '" fill="${primaryColor}"></circle>' +
      '</svg>'
    );
  }

  // NOTE: the outer element passed to new maplibregl.Marker() has its
  // transform style overwritten by MapLibre on every setLngLat/move, since
  // MapLibre uses that same style property to translate the marker to its
  // screen position. Rotation must therefore be applied to an inner wrapper
  // div instead, or it will clobber MapLibre's positioning transform and the
  // marker will jump to the container's top-left corner.
  function createArrowMarkerElement(heading) {
    var el = document.createElement('div');
    el.style.width = HEADING_MARKER_SIZE + 'px';
    el.style.height = HEADING_MARKER_SIZE + 'px';
    var rotator = document.createElement('div');
    rotator.style.width = HEADING_MARKER_SIZE + 'px';
    rotator.style.height = HEADING_MARKER_SIZE + 'px';
    var hasHeading = heading != null && Number.isFinite(heading);
    el.dataset.heading = hasHeading ? String(heading) : '';
    if (hasHeading) {
      rotator.style.transform = 'rotate(' + heading + 'deg)';
    }
    rotator.innerHTML = buildHeadingMarkerSvg(hasHeading);
    el.appendChild(rotator);
    return el;
  }

  function updateArrowMarkerElement(el, heading) {
    var rotator = el.firstElementChild;
    if (!rotator) return;
    var hasHeading = heading != null && Number.isFinite(heading);
    var hadHeading = el.dataset.heading === '' ? false : el.dataset.heading != null && el.dataset.heading !== '';
    if (hasHeading) {
      rotator.style.transform = 'rotate(' + heading + 'deg)';
      el.dataset.heading = String(heading);
    } else {
      rotator.style.transform = '';
    }
    if (hasHeading !== hadHeading) {
      rotator.innerHTML = buildHeadingMarkerSvg(hasHeading);
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

  function lonLatToTileXY(lon, lat, zoom) {
    var latRad = (lat * Math.PI) / 180;
    var n = Math.pow(2, zoom);
    return {
      x: Math.floor(((lon + 180) / 360) * n),
      y: Math.floor(
        ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
      ),
    };
  }

  /**
   * Warms the HTTP cache for a raster style's tile sources around the
   * current viewport, without adding it to the map. Esri's free tile
   * servers are noticeably slower than the standard basemap's CDN, and
   * Hybrid alone layers three separate raster sources (imagery,
   * transportation, labels) on top of each other — switching to it "cold"
   * means waiting on all three fetches at once. Called ahead of time (see
   * \`window.prefetchLayerTiles\`) so that by the time the user actually
   * picks the layer, most tiles are already cached and \`setStyle\` just
   * has to repaint from cache instead of hitting the network.
   */
  function prefetchRasterStyleTiles(stylePayload) {
    if (!stylePayload || stylePayload.type !== 'json' || !stylePayload.value.sources) return;
    var center = map.getCenter();
    var zoom = Math.max(0, Math.round(map.getZoom()));
    var tile = lonLatToTileXY(center.lng, center.lat, zoom);
    var sources = stylePayload.value.sources;
    Object.keys(sources).forEach(function (key) {
      var source = sources[key];
      if (source.type !== 'raster' || !source.tiles || !source.tiles[0]) return;
      var z = source.maxzoom != null ? Math.min(zoom, source.maxzoom) : zoom;
      var template = source.tiles[0];
      for (var dx = -1; dx <= 1; dx += 1) {
        for (var dy = -1; dy <= 1; dy += 1) {
          var url = template
            .replace('{z}', String(z))
            .replace('{x}', String(tile.x + dx))
            .replace('{y}', String(tile.y + dy));
          fetch(url).catch(function () {});
        }
      }
    });
  }
  `;
}
