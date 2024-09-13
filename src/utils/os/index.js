var userAgent = window.navigator.userAgent,
  platform =
    (navigator.userAgentData && navigator.userAgentData.platform) ||
    window.navigator.platform,
  macosPlatforms = ["Macintosh", "MacIntel", "MacPPC", "Mac68K", "darwin"],
  windowsPlatforms = ["Win32", "Win64", "Windows", "WinCE"],
  iosPlatforms = ["iPhone", "iPad", "iPod"],
  os = null;

if (macosPlatforms.indexOf(platform) !== -1) {
  os = "Mac OS";
} else if (iosPlatforms.indexOf(platform) !== -1) {
  os = "iOS";
} else if (windowsPlatforms.indexOf(platform) !== -1) {
  os = "Windows";
} else if (/Android/.test(userAgent)) {
  os = "Android";
} else if (!os && /Linux/.test(platform)) {
  os = "Linux";
}

const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    userAgent
  );

const isIOS = [
  "iPad Simulator",
  "iPhone Simulator",
  "iPod Simulator",
  "iPad",
  "iPhone",
  "iPod",
].includes(platform) || (userAgent.includes("Mac") && "ontouchend" in document);

const isAndroid = userAgent.toLowerCase().indexOf("android") > -1;

window.os = os;
window.isMobile = isMobile;
window.isIOS = isIOS;
window.isAndroid = isAndroid;
