
declare global {
  type TextShadowValue = {
    color?: string
    offSetX?: number
    offSetY?: number
    blur?: number
  }
  
  type AttributesProps = {
    blockId: string
    color?: string
    textAlign?: string | object
    textShadow?: TextShadowValue
  } & Record<string,any>

}


function StyleSheets(
  blockId: string,
  styleCss?: string,
  styleSelector?: Document
) {
  styleSelector = styleSelector || window.document;
  if (styleCss || styleCss === "") {
    const $blockId = styleSelector.getElementById(`pkb-blocks-${blockId}`);
    if ($blockId === null) {
      let cssInline = document.createElement("style");
      cssInline.type = "text/css";
      cssInline.id = `pkb-blocks-${blockId}`;
      cssInline.innerHTML = styleCss;
      styleSelector.getElementsByTagName("head")[0].appendChild(cssInline);
    } else {
      if (styleCss) $blockId.innerHTML = styleCss;
      else $blockId.remove();
    }
  }
}
export default StyleSheets;
