import { iF, elseIf } from "./helper";
// import standardFontNames from "../../textControls/typographyChild/standardFontName";
const lg = 'desktop', md = 'tablet',sm = 'mobile';
const t = 'top', r = 'right', b = 'bottom', l = 'left';
const positions = [t, r, b, l];
const positionsBoxShadow = ['offSetX', 'offSetY', 'blur', 'spread'];

// Set CSS: Selector
export function addSelector (selector:string, value?:string) {
  return iF(value, selector + '{', '}');
};
// Set CSS: Selector
export function setMediaQuery (deviceNumber: string | number, value?: string) {
  return iF(value, `@media all and (max-width: ${deviceNumber}px){`, '}');
};
// Add Property
export function addProperty (property: string, value?: string, prefix = '', suffix = '', defaults = '') {
  // return iF(value, property + ':' + prefix, suffix + ';', defaults)
  return elseIf(Number.isFinite(value) || value, property + ':' + prefix + value + suffix + ';', defaults);
};
export function propertyZero (property: string, value?: string, prefix = '', suffix = '', defaults = '') {
  return elseIf(Number.isFinite(value), property + ':' + prefix + value + suffix + ';', defaults);
};
// Set Css: Background Gradient
export function gradient({
  attributes, property, valueKey,
  defaultColor1 = 'rgb(155, 81, 224)', defaultColor2 = 'rgb(6, 147, 227)',
  suffix = '', allowBlendMode = false
}) {
  var css = '';
  const values = attributes[valueKey];
  const valuePreset = attributes[valueKey + 'Preset'];
  const angle = elseIf(values['type'] !== 'radial-gradient', `${values['angle']||135}deg, `);
  const position = elseIf(values['type'] === 'radial-gradient', `${values['position']}, `);
  const location1 = iF(values['location1'], ' ', '%');
  const location2 = iF(values['location2'], ' ', '%', ` ${100}%`);

  css +=  addProperty( property, elseIf( valuePreset, valuePreset + suffix,
              ''.concat(values['type'], '(',
              angle, position, values['color1'] || defaultColor1, location1, ', ',
              values['color2'] || defaultColor2, location2, ')', elseIf(values['type'] && suffix, suffix)
            )
          ));
  css += elseIf(allowBlendMode, addProperty('mix-blend-mode', values['blendMode']));
  return css;
}
// Set CSS: Color and Gradient Type
export function color_gradient({
  attributes, typeValueKey,
  property1, valueKeyNormal,
  property2, valueKeyGradient, suffix, allowBlendMode,  newPropertyInGradient = '',
  defaultColor1, defaultColor2
}) {
  var css = '';
  function attr(valueKey) { return attributes[valueKey]; }
  const type = attr(typeValueKey);
  css += elseIf( type === 'normal' || type === 'color', addProperty(property1, attr(valueKeyNormal)) )
  css += elseIf( type === 'gradient',
          gradient({ attributes, property: property2, valueKey: valueKeyGradient, defaultColor1, defaultColor2, suffix, allowBlendMode })
          .concat(newPropertyInGradient)
        )
  return css;
}
// Set CSS: Background Image
export function advImageBackground( attributes, device, allowSRA = false, hover = '', allowUrl = false, overlay = false ) {
  function attr(valueKey) { return attributes[valueKey]; }
  const backgroundType = attr(overlay ? `overlayBGType${hover}` : `backgroundType${hover}`);
  const valueKey = overlay ? 'overlayBGImage' : 'bgImage';
  const imgBackground = overlay ? `overlayImageBG${hover}` : `imgBackground${hover}`;

  function ImagePositionValues(device, hover) {
    const value = attr(valueKey.concat('Position', hover));
    const values = `${value[device]['x'] * 100}% ${value[device]['y'] * 100}%`;
    return addProperty('background-position', values);
  }

  return elseIf( backgroundType === 'image', ''.concat(
    elseIf(allowUrl, addProperty( 'background-image', attr(imgBackground), 'url(', ')' )),
    addProperty( 'background-size', attr(valueKey.concat('Size', hover))[device]||elseIf(allowSRA, 'cover') ),
    addProperty( 'background-repeat', attr(valueKey.concat('Repeat', hover))[device]||elseIf(allowSRA, 'no-repeat') ),
    addProperty( 'background-attachment', attr(valueKey.concat('Attachment', hover))[device]||elseIf(allowSRA, 'scroll') ),
    ImagePositionValues(device, hover)
  ));
}
export function foreach(property, suffix, value, unit) {
  return positions.map(pos =>
    value[pos]
    ? addProperty( property + pos + suffix, value[pos] + elseIf(value ,unit) )
    : ''
  ).join('');
}
// Set CSS: Spacing: Padding and Margin and Support Media Query All Devices
export function spacing( attributes, property, valueKey, device ) {
  const values = attributes[valueKey];
  return foreach(property + '-', '', elseIf(device, values[device], values), values?.unit + ' !important');
};
// Set CSS Text Box Shadow
export function textBoxShadow (attributes, valueKey) {
  const value = attributes[valueKey];
  const bsCondition = value['offSetX'] === '' && value['offSetY'] === '' && value['blur'] === '';
  const values = ['offSetX', 'offSetY', 'blur'].map( pos => bsCondition ? '' : ' ' + (value[pos]||0) + 'px' ).join('');

  return addProperty('text-shadow', elseIf(bsCondition && value['color'], '', value['color']) + values);
};
// Set CSS: Border Width
export function borderWidth( attributes, valueKey, device ) {
  const values = attributes[valueKey];
  return foreach('border-', '-width', values[device], values?.unit);
};
// Set CSS: Border Radius
export function borderRadius( attributes, valueKey, device ) {
  const value = attributes[valueKey];
  const radiusCondition = value[device]['top'] === '' && value[device]['right'] === '' && value[device]['bottom'] === '' && value[device]['left'] === '';
  const values = addProperty('border-radius',
    positions.map( position => elseIf(radiusCondition, '', (value[device][position]||0) + value?.unit+' ' ) ).join('')
  );
  return values;
};
// Set CSS: Border
export function border( attributes, prefix, device, allowStyleColor = false ) {
  function attr( valueKey ) { return attributes[valueKey]; }
  const border = prefix ? prefix+'Border' : 'blockBorder';
  var css = '';
  css += elseIf(allowStyleColor, iF(attr(border+'Style'), 'border:', iF(attr(border+'Color'), ' ') + ';'));
  css += elseIf(attr(border+'Style'), borderWidth( attributes, border+'Width', device ));
  css += borderRadius( attributes, border+'Radius', device );
  return css;
}
// Set CSS: Box Shadow
export function boxShadow( attributes, prefix, enableBoxShadow = true ) {
  function attr( valueKey ) { return attributes[valueKey]; }
  const bShadow = prefix ? prefix+'BoxShadow' : 'boxShadow';
  const value = attr(bShadow);
  const bsCondition = value['offSetX'] === '' && value['offSetY'] === '' && value['blur'] === '' && value['spread'] === '';
  const values = positionsBoxShadow.map( pos => elseIf(bsCondition, '', (value[pos]||0) + 'px ' ) ).join('')
  const ifValue = () => {
    return elseIf(values, addProperty('box-shadow', iF(attr(bShadow+'Color')) + ' ' + values + elseIf(attr(bShadow+'Inset'), ' inset')));
  };
  return elseIf( enableBoxShadow, elseIf(attr('enableBoxShadow'), ifValue()), ifValue() );
};
// Set CSS: Image Filter
export function imgFilter (attributes, valueNumber = 'imageFilterNumber', imageFilter = 'imageFilter') {
  function attr(valueKey) { return attributes[valueKey]; }
  const deg = elseIf(attr(imageFilter) === 'hue-rotate', 'deg' );
  const value = iF(attr(imageFilter), '', '('+ attr(valueNumber) + deg +')');
  return addProperty('filter', value);
};
// Set CSS: Image Filter Hover
export const imgFilterHover = (attributes, selector, valueNumber = 'imageFilterNumberHover', imageFilter = 'imageFilterHover') => {
  var css = '';
  function attr(valueKey) { return attributes[valueKey]; }
  const imageFilters = attr(imageFilter);
  const deg = elseIf(imageFilters === 'hue-rotate', 'deg' );
  const px = elseIf(imageFilters === 'blur', 'px' );
  const filter = elseIf(imageFilters !== 'scale', 'filter', 'transform' );
  const value = iF(imageFilters, '', '('+ attr(valueNumber) + deg + px +')');
  function property(property) { return elseIf(imageFilters === 'scale', addProperty(property, `scale(${attr(valueNumber)})`)); }

  css += addSelector(`${selector} img:hover`,
    addProperty(filter, value) + property('-webkit-transform') + property('-moz-transform')
  );
  css += elseIf(imageFilters === 'scale',
    addSelector(`${selector} img`, 'transition: transform .3s ease-in-out;') +
    addSelector(`${selector} .has-image-hover`, 'overflow: hidden;')
  );
  return css;
};
// Set CSS Typography
export function typography( attributes, prefix, device, allowOther = false ) {
  function attr(valueKey) { return attributes[valueKey]; }
  function addProperty( property, valueKey, devices, unit = '' ) {
    return iF(devices ? attr(valueKey)[devices] : attr(valueKey), property+':', unit+';')
  }
  const font = elseIf(prefix, prefix+'Font', 'font');
  const lineHeight = elseIf(prefix, prefix+'LineHeight', 'lineHeight');
  const letterSpace = elseIf(prefix, prefix+'LetterSpace', 'letterSpace');
  var css = '';
  css += elseIf( allowOther, ''.concat(
          attr(font+'Family') === 'System Default'
          ? 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";'
          : addProperty( 'font-family', font+'Family'),
          filterEqual( ['regular', 'italic', 'inherit'], attr(font+'Weight') ) ? '' : addProperty( 'font-weight', font+'Weight')?.replace('00i', '00'),
          addProperty( 'font-style', font+'Style'), addProperty( 'text-transform', font+'Transform'),
          addProperty( 'text-decoration', font+'Decoration')
        ));
  css += addProperty( 'font-size', font+'Size', device, attr(font+'Size')['unit']);
  css += addProperty( 'line-height', lineHeight, device );
  css += addProperty( 'letter-spacing', letterSpace, device, 'px' );
  return css;

}
// export function addGFonts(attributes, arrayPrefixes) {
//   const gFontValues = arrayPrefixes.map(prefix => {
//     const gFont = attributes[prefix + 'FontFamily'];
//     const font_weight = attributes[prefix + 'FontWeight'];
//     const fw$default = filterEqual(['', 'regular', 'bold', 'italic', 'inherit', undefined], font_weight);

//     if (fw$default) {
//       var fontWeightValues = '';
//     } else if (font_weight === 'italic') {
//       var fontWeightValues = ':ital@1';
//     } else if (font_weight?.includes('00i')) {
//       var fontWeightValues = `:ital,wght@1,${font_weight?.replace('00i', '00')}`;
//     } else {
//       var fontWeightValues = `:wght@${font_weight}`
//     }

//     const link = elseIf(gFont, `@import url('https://fonts.googleapis.com/css2?family=`.concat(gFont, fontWeightValues, `&display=swap');`));

//     return filterEqual(standardFontNames, gFont) ? '' : link;
//   }).join('');

//   return gFontValues;
// }
const filterEqual = (arrayValues, attrValue) => {
  const values = arrayValues?.filter(value => attrValue === value);
  return values.length
};

