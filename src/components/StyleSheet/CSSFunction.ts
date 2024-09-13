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

// Set CSS Text Box Shadow
export function textBoxShadow (value: TextShadowValue) {
  value = value||{}
  const values = Object.values(value).filter(v => typeof v !== 'string')
  const hasShadow = values.filter(v=>v).length > 0

  let shadow = '';
  if(hasShadow && !!value.color){
    shadow = value.color + ' ' + ['offSetX', 'offSetY', 'blur']
    .map((pos) => ' ' + `${(value as any)[pos]||0}` + 'px' ).join('');
  } else if(!!value.color){
    shadow = `${value.color} 0 0 0`
  }

  return addProperty('text-shadow', shadow);
};