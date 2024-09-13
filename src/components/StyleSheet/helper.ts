export function iF(value?: string | boolean, prefix = "", suffix = "", defaults = "") {
  return value ? prefix + value + suffix : defaults;
}
export function elseIf(value1?: any, value2?: any, defaults = "") {
  return value1 ? value2 || '' : defaults;
}
