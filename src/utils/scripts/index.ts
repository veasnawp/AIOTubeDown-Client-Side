function lazyScript(src: string, onload: GlobalEventHandlers['onload']) {
  var script = document.createElement("script");
  (script.async = !0),
    (script.defer = !0),
    onload && (script.onload = onload),
    document.head.appendChild(script),
    (script.src = src);
}
