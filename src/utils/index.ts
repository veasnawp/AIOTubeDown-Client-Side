
type ObjectArray<T> = Exclude<T, null | undefined | boolean | bigint>
type ObjectType<T> = ObjectArray<T>
type ArrayType<T> = T extends ObjectArray<T> & { length: number } ? T : never

export function isObject<T>(obj: T): obj is ObjectType<T> {
  return obj !== null && obj !== undefined && !Array.isArray(obj) && typeof obj === 'object';
}

export function isArray<T>(array: T): array is ArrayType<T> {
  return typeof array === 'object' && Array.isArray(array) && array !== null && array !== undefined;
}

export function isNumber<T>(n: T) {
  return !isNaN(parseFloat(n as string)) && isFinite(n as number);
}

export function toCapitalized(words: string) {
  return words.replace(/(^\w{1})|(\s+\w{1})/g, (letter) => letter.toUpperCase());
}

export function sleep(delayInSecond: number) {
  return new Promise((resolve) => setTimeout(resolve, delayInSecond * 1000));
}

export function removeDuplicateObjArray<T>(arr: Prettify<T>[], key: keyof T) {
  return [...new Map(arr.map((item) => [item[key], item])).values()];
}

export function removeDuplicateArray<T>(arr: Array<T>) {
  return [...new Set(arr)];
}

export function isValidJSON(jsonString?: string) {
  if (jsonString != undefined) {
    try {
      var handleJsonString = jsonString
        .replace(/(\t|\n|\r|\  )/g, '')
        .replace(/\": "/g, '":"')
        .replace(/\,}/g, '}')
        .replace(/\,]/g, ']');
      var obj = JSON.parse(handleJsonString);
      if (obj && typeof obj === 'object') {
        return obj;
      }
    } catch (e) { }
  }
  return false;
}

export function isValidUrl(link: string | URL){
  try {
    const url = new URL(link);
    const host = url.host;
    const hostSplit = host.split('.');
    const ext = hostSplit.at(-1) || '';
    return Boolean(url) && hostSplit.length > 1 && ext.length > 1 && ["http://", "https://"].some(v => url.href.startsWith(v));
  }
  catch {
    return false;
  }
}

type AscOrDesc = 'asc' | 'desc';

export function arraySort(arr: any[], ascOrDesc: AscOrDesc = 'asc', keys?: Record<string, any>) {
  return Array(...arr).sort(function (a, b) {
    const keysString = (val: any) => typeof keys === 'object' && val[keys.parent][keys.child];
    a = keys ? keysString(a).toLowerCase() : a.toLowerCase();
    b = keys ? keysString(b).toLowerCase() : b.toLowerCase();

    return ascOrDesc === 'asc' ? (a > b ? 1 : -1) : a > b ? -1 : 1;
    // if (a == b) return 0;
    // if (a > b) return 1;
    //   return ascOrDescNumber || -1;
  });
}

export function arraySplitting<TData>(array: TData[], chunk: number) {
  let arr = array;
  let lengthOfArr = arr.length;
  let newArr = [];
  let lastArr = [] as TData[];
  if ((arr.length % chunk) === 0) {
    newArr = [...arr]
  } else {
    let mode = lengthOfArr % chunk
    newArr = arr.slice(0, -(mode))
    lastArr = arr.slice(lengthOfArr - mode, lengthOfArr)
  }
  let arrSplitting = [...Array(newArr.length / chunk).keys()].map(() => arr.splice(0, chunk));
  arrSplitting = lastArr.length > 0
    ? [...arrSplitting, lastArr]
    : arrSplitting

  return arrSplitting
}

export function setCookie(cookieName: string, cookieValue: string, expireDays?:number, domain?:string) {
  var d = new Date();
  d.setTime(d.getTime() + (expireDays || 30) * 24 * 3600 * 1000);
  var expires = "expires=" + d.toUTCString();
  document.cookie = 
    cookieName + "=" + cookieValue + ";" + expires + ";path=/" + (domain ? '; domain=.' + domain + ';' : "");
}

export function getCookie(cookieName: string) {
  var name = cookieName + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(";");
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) === " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

// uts
export function getHostName(url: string) {
  var match = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);
  if (match != null && match.length > 2 && typeof match[2] === 'string' && match[2].length > 0) {
    return match[2]
  } else { 
    return null 
  }
}

export function getQueryStringValue(uts_uri:string, key:string) {
  return decodeURIComponent(
    uts_uri.replace(
      new RegExp(
        "^(?:.*[&\\?]" +
          encodeURIComponent(key).replace(/[\.\+\*]/g, "\\$&") +
          "(?:\\=([^&]*))?)?.*$",
        "i"
      ),
      "$1"
    )
  );
}
export function uts_unscramble(v: string) {
  var b = "";
  var s = "";
  var o = "";
  var input_character_pos = 0;
  for (var i = 0; i < v.length; i++) {
    input_character_pos = s.indexOf(v.charAt(i));
    o += b.charAt(input_character_pos);
  }
  return o;
}

export const encodeJsonBtoa = (obj:object) => {
  let urlJson = encodeURIComponent(JSON.stringify(obj))
  return btoa(unescape(urlJson))
}

export const decodeJsonBtoa = (data:string) => {
  var decodeAtob = atob(data)
  return JSON.parse(decodeURIComponent(escape(decodeAtob)))
}