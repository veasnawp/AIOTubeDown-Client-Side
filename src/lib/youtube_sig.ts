// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

// import logger from "@/helper/logger";


export function nfunc(n:string, text_nfunc: string) {
  // logger?.log("n",n)
  // logger?.log({text_nfunc})
  return eval(`
    ${text_nfunc}
    nfunc("${n}");
  `)
};

export function fillN(url,text_nfunc){
  const urlObj = new URL(url);
  const params = new URLSearchParams(urlObj.search);

  const n = params.get("n");
  const enc_n = nfunc(n, text_nfunc)
  params.set("n", enc_n);
  urlObj.search = params.toString();
  return urlObj.toString();
}

export function fixYouTubeVideoPlayback(url:string, text_nfunc:string){
  // const isMatches = html.match(/(function nfunc\().*?(\.join\(\"\"\)\}\;)/g)
  // html.match(/(nfunc\().*?(\.join\(""\))/g)
  // if(!isMatches){
  //   return url
  // }
  // const enhanced_except = isMatches[0];
  // console.log("enhanced_except",enhanced_except)
  return fillN(url, text_nfunc)
}