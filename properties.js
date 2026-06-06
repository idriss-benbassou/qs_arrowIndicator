/* ============================================================
 * Arrow Indicator - Property panel
 * ============================================================ */
define([], function () {
  'use strict';

  function isDir4(d) {
    if (!d.props) { return false; }
    var t = d.props.type;
    return t === 'straight' || t === 'pentagon' || t === 'chevron' ||
      t === 'notched' || t === 'step' || t === 'striped';
  }
  function isTwoWay(d)  { return d.props && d.props.type === 'two-way'; }
  function isElbow(d)   { return d.props && d.props.type === 'elbow'; }
  function isCurved(d)  { return d.props && d.props.type === 'curved'; }
  function isUturn(d)   { return d.props && d.props.type === 'uturn'; }
  function solidBg(d)   { return d.props && d.props.transparentBg === false; }
  function isOutline(d) { return d.props && d.props.style === 'outline'; }
  function hasBody(d) {
    if (!d.props) { return true; }
    var t = d.props.type;
    return t !== 'pentagon' && t !== 'chevron';
  }

  var data = {
    uses: 'data',
    items: {
      measures:   { uses: 'measures',   min: 0, max: 0 },
      dimensions: { uses: 'dimensions', min: 0, max: 0 }
    }
  };

  var arrow = {
    type: 'items',
    label: 'Arrow',
    items: {
      arrowType: {
        type: 'string', component: 'dropdown', label: 'Shape',
        ref: 'props.type', defaultValue: 'straight',
        options: [
          { value: 'straight', label: 'Straight arrow' },
          { value: 'pentagon', label: 'Pentagon arrow' },
          { value: 'chevron',  label: 'Chevron' },
          { value: 'notched',  label: 'Notched arrow' },
          { value: 'striped',  label: 'Striped arrow' },
          { value: 'two-way',  label: 'Two-way arrow' },
          { value: 'four-way', label: 'Four-way arrow' },
          { value: 'elbow',    label: 'Elbow' },
          { value: 'curved',   label: 'Curved arrow' },
          { value: 'step',     label: 'Step Z arrow' },
          { value: 'uturn',    label: 'U form arrow' }
        ]
      },
      direction4: {
        type: 'string', component: 'dropdown', label: 'Direction',
        ref: 'props.straightDirection', defaultValue: 'right',
        options: [
          { value: 'up', label: 'Up' }, { value: 'down', label: 'Down' },
          { value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }
        ],
        show: isDir4
      },
      twoWayOrientation: {
        type: 'string', component: 'dropdown', label: 'Orientation',
        ref: 'props.twoWayOrientation', defaultValue: 'horizontal',
        options: [
          { value: 'horizontal', label: 'Horizontal' },
          { value: 'vertical',   label: 'Vertical' }
        ],
        show: isTwoWay
      },
      elbowDirection: {
        type: 'string', component: 'dropdown', label: 'Elbow orientation',
        ref: 'props.elbowDirection', defaultValue: 'top-right',
        options: [
          { value: 'top-right',    label: 'Top to Right' },
          { value: 'top-left',     label: 'Top to Left' },
          { value: 'bottom-right', label: 'Bottom to Right' },
          { value: 'bottom-left',  label: 'Bottom to Left' },
          { value: 'left-down',    label: 'Left to Down' },
          { value: 'left-up',      label: 'Left to Up' },
          { value: 'right-down',   label: 'Right to Down' },
          { value: 'right-up',     label: 'Right to Up' }
        ],
        show: isElbow
      },
      curvedDirection: {
        type: 'string', component: 'dropdown', label: 'Curve orientation',
        ref: 'props.curvedDirection', defaultValue: 'top-right',
        options: [
          { value: 'top-right',    label: 'Top to Right' },
          { value: 'top-left',     label: 'Top to Left' },
          { value: 'bottom-right', label: 'Bottom to Right' },
          { value: 'bottom-left',  label: 'Bottom to Left' },
          { value: 'left-down',    label: 'Left to Down' },
          { value: 'left-up',      label: 'Left to Up' },
          { value: 'right-down',   label: 'Right to Down' },
          { value: 'right-up',     label: 'Right to Up' }
        ],
        show: isCurved
      },
      uturnDirection: {
        type: 'string', component: 'dropdown', label: 'U opens',
        ref: 'props.uturnDirection', defaultValue: 'down',
        options: [
          { value: 'down',  label: 'Down' },
          { value: 'up',    label: 'Up' },
          { value: 'left',  label: 'Left' },
          { value: 'right', label: 'Right' }
        ],
        show: isUturn
      }
    }
  };

  var style = {
    type: 'items',
    label: 'Style',
    items: {
      fillStyle: {
        type: 'string', component: 'dropdown', label: 'Fill style',
        ref: 'props.style', defaultValue: 'filled',
        options: [
          { value: 'filled',  label: 'Filled' },
          { value: 'outline', label: 'Outline' }
        ]
      },
      color: {
        type: 'object', component: 'color-picker', label: 'Color',
        ref: 'props.fillColor',
        defaultValue: { index: -1, color: '#3a4a5a' }
      },
      strokeWidth: {
        type: 'number', component: 'slider', label: 'Border width',
        ref: 'props.strokeWidth', min: 0.5, max: 20, step: 0.5,
        defaultValue: 4, show: isOutline
      },
      bodyThickness: {
        type: 'number', component: 'slider', label: 'Arrow thickness',
        ref: 'props.bodyThickness', min: 0.05, max: 0.95, step: 0.01,
        defaultValue: 0.40, show: hasBody
      },
      headLength: {
        type: 'number', component: 'slider', label: 'Arrow head length',
        ref: 'props.headLength', min: 0.05, max: 0.90, step: 0.01,
        defaultValue: 0.42
      },
      headWidth: {
        type: 'number', component: 'slider', label: 'Arrow head width',
        ref: 'props.headWidth', min: 0.10, max: 1.00, step: 0.01,
        defaultValue: 0.82, show: hasBody
      },
      cornerRadius: {
        type: 'number', component: 'slider', label: 'Corner radius',
        ref: 'props.cornerRadius', min: 0, max: 1, step: 0.01,
        defaultValue: 0.45, show: isElbow
      },
      transparentBg: {
        type: 'boolean', component: 'switch', label: 'Background',
        ref: 'props.transparentBg', defaultValue: true,
        options: [
          { value: true,  label: 'Transparent' },
          { value: false, label: 'Solid' }
        ]
      },
      backgroundColor: {
        type: 'object', component: 'color-picker', label: 'Background color',
        ref: 'props.backgroundColor',
        defaultValue: { index: -1, color: '#ffffff' },
        show: solidBg
      }
    }
  };

  var margins = {
    type: 'items', label: 'Margins',
    items: {
      info: {
        component: 'text',
        label: 'Space left empty on each side before drawing the arrow.'
      },
      marginLeft:   { type:'number', component:'slider', label:'Left',
        ref:'props.marginLeft',   min:0, max:0.45, step:0.01, defaultValue:0.06 },
      marginRight:  { type:'number', component:'slider', label:'Right',
        ref:'props.marginRight',  min:0, max:0.45, step:0.01, defaultValue:0.06 },
      marginTop:    { type:'number', component:'slider', label:'Top',
        ref:'props.marginTop',    min:0, max:0.45, step:0.01, defaultValue:0.06 },
      marginBottom: { type:'number', component:'slider', label:'Bottom',
        ref:'props.marginBottom', min:0, max:0.45, step:0.01, defaultValue:0.06 }
    }
  };

  var about = {
    type: 'items', label: 'About',
    items: {
      header: {
        component: 'text',
        label: 'Arrow Indicator - by Idriss Benbassou'
      },
      linkedin: {
        component: 'button',
        label: 'Open LinkedIn profile',
        action: function () {
          window.open(
            'https://www.linkedin.com/in/idriss-benbassou/',
            '_blank',
            'noopener,noreferrer'
          );
        }
      }
    }
  };

  return {
    type: 'items',
    component: 'accordion',
    items: {
      data: data,
      arrow: arrow,
      style: style,
      margins: margins,
      settings: { uses: 'settings' },
      about: about
    }
  };
});
