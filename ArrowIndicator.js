/* =======================================
 * Arrow Indicator - Qlik Sense extension
 *
 * by Idriss Benbassou - v1
 * maj june 2026
 * ======================================== */
define([
  'jquery',
  './properties',
  './lib/svg-renderer',
  'css!./style.css'
], function ($, propertyPanel, renderer) {
  'use strict';

  function numProp(v, d) {
    return (typeof v === 'number' && isFinite(v)) ? v : d;
  }
  function pickColor(obj, fallback) {
    if (obj && typeof obj.color === 'string' && obj.color !== '') {
      return obj.color;
    }
    return fallback;
  }
  function normalizeType(t) {
    var ok = ['straight', 'pentagon', 'chevron', 'notched',
      'two-way', 'four-way', 'elbow', 'curved', 'step', 'striped', 'uturn'];
    return (ok.indexOf(t) >= 0) ? t : 'straight';
  }

  return {

    initialProperties: {
      qHyperCubeDef: {
        qDimensions: [],
        qMeasures: [],
        qInitialDataFetch: []
      },
      showTitles: false,
      showDetails: false,
      title: '',
      subtitle: '',
      footnote: '',
      props: {
        type: 'straight',
        straightDirection: 'right',
        twoWayOrientation: 'horizontal',
        elbowDirection: 'top-right',
        curvedDirection: 'top-right',
        uturnDirection: 'down',
        style: 'filled',
        fillColor: { index: -1, color: '#3a4a5a' },
        bodyThickness: 0.40,
        headLength: 0.42,
        headWidth: 0.82,
        cornerRadius: 0.45,
        strokeWidth: 4,
        transparentBg: true,
        backgroundColor: { index: -1, color: '#ffffff' },
        marginLeft: 0.06,
        marginRight: 0.06,
        marginTop: 0.06,
        marginBottom: 0.06
      }
    },

    definition: propertyPanel,

    support: {
      snapshot: true,
      export: true,
      exportData: false
    },

    paint: function ($element, layout) {
      try {
        var p = (layout && layout.props) || {};

        var w = $element.width() ||
          ($element[0] && $element[0].clientWidth) || 300;
        var h = $element.height() ||
          ($element[0] && $element[0].clientHeight) || 200;

        var bg = (p.transparentBg === false)
          ? pickColor(p.backgroundColor, '#ffffff')
          : 'transparent';

        var cfg = {
          type: normalizeType(p.type),
          direction4: p.straightDirection || 'right',
          twoWayOrientation: p.twoWayOrientation || 'horizontal',
          elbowDirection: p.elbowDirection || 'top-right',
          curvedDirection: p.curvedDirection || 'top-right',
          uturnDirection: p.uturnDirection || 'down',
          style: (p.style === 'outline') ? 'outline' : 'filled',
          color: pickColor(p.fillColor, '#3a4a5a'),
          backgroundColor: bg,
          bodyThickness: numProp(p.bodyThickness, 0.40),
          headLength: numProp(p.headLength, 0.42),
          headWidth: numProp(p.headWidth, 0.82),
          cornerRadius: numProp(p.cornerRadius, 0.45),
          strokeWidth: numProp(p.strokeWidth, 4),
          marginLeft: numProp(p.marginLeft, 0.06),
          marginRight: numProp(p.marginRight, 0.06),
          marginTop: numProp(p.marginTop, 0.06),
          marginBottom: numProp(p.marginBottom, 0.06)
        };

        var svg = renderer.buildArrowSvg(w, h, cfg);

        $element.empty();
        $element.append(
          '<div class="arrowind-container">' + svg + '</div>'
        );

      } catch (err) {
        $element.empty();
        $element.append(
          '<div class="arrowind-message">Arrow Indicator render error: ' +
          ((err && err.message) || err) + '</div>'
        );
      }

      return $.Deferred().resolve().promise();
    }
  };
});
