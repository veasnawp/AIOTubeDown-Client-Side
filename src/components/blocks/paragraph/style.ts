import StyleSheets from '@/components/StyleSheet';
import { addProperty, addSelector, setMediaQuery, textBoxShadow } from '@/components/StyleSheet/CSSFunction';
import { elseIf } from '@/components/StyleSheet/helper';
import PropTypes from 'prop-types';

const propTypes = {
  attributes: PropTypes.object.isRequired,
};
const lg = 'desktop', md = 'tablet', sm = 'mobile';

const Styles = (attributes: AttributesProps) => {
  const { blockId } = attributes;
  const width_md = '999.98', width_sm = '480';
  function attr(valueKey: keyof AttributesProps): any { 
    return attributes[valueKey]; 
  }


  const BLOCK_ID = `#block__`.concat(blockId);
  const mainBlockSelector = '.editor-styles-wrapper .blogger-block-paragraph'.concat(BLOCK_ID);
  const blockSelector = '.editor-styles-wrapper .blogger-block-paragraph'.concat(BLOCK_ID);
  const blockSelectorPTag = '.blogger-block-paragraph'.concat(BLOCK_ID, ' p');

  function replaceMediaQuery(device: string, allowDevice = false) {
    return ''.concat(
      // selector 1
      addSelector(blockSelector, ''.concat(
        // typography( attributes, 'text', device, elseIf(allowDevice, true, false) ),
        addProperty('text-align', attr('textAlign')?.[device]),
        elseIf(
          allowDevice, 
          elseIf(!attr('color')?.includes('gradient'), addProperty('color', attr('color')))
        ),
        // elseIf(allowDevice,
        //   elseIf((attr('highlightColor')||attr('highlightBGColor'))&&attr('headingTag')['content'].includes('<mark', '</mark>'), '',
        //     _color_gradient('textColorType', 'color', 'textColor', 'background', 'textGradient', '-webkit-background-clip: text; -webkit-text-fill-color: transparent;')
        //   )
        // ),
        elseIf(allowDevice, textBoxShadow(attr('textShadow'))),
        // _spacing( 'padding', 'wrapPadding', device ),
        // _spacing( 'margin', 'wrapMargin', device ),
      )),
      // selector 2
      addSelector(blockSelectorPTag, ''.concat(
        elseIf(allowDevice, attr('color')?.includes('gradient') 
          ? ''.concat(
            addProperty('background', attr('color')),
            '-webkit-background-clip: text;',
            'background-clip: text;',
            '-webkit-text-fill-color: transparent;'
          ) 
          : ''
        ),
      )),
      // elseIf(allowDevice,
        // addSelector( blockSelector + '> a', addProperty('color', attr('textLinkColor')) ) +
        // addSelector( blockSelector + '> a:hover', addProperty('color', attr('textLinkColorHover')) )
      // ),
      // selector 3
      // elseIf(attr('headingTag')['content'].includes('<mark', '</mark>'),
      //   addSelector(blockSelector + ' mark', ''.concat(
      //     typography( attributes, 'highlight', device, elseIf(allowDevice, true, false) ),
      //     elseIf(allowDevice,
      //       addProperty('color', attr('highlightColor'), '', '', 'color: #e1306c;') +
      //       addProperty('background-color', attr('highlightBGColor'), '', '', 'background-color:transparent;')
      //     ),
      //     _spacing( 'padding', 'highlightWrapPadding', device ),
      //     border( attributes, 'highlight', device, elseIf(allowDevice, true, false) )
      //   ))
      // ),
    );
  }

  StyleSheets(`avd-paragraph_${blockId}`, ''.concat(
    // ======= Desktop =======
    // addSelector(mainBlockSelector, ''.concat(
    //   addProperty('color', attr('color')),
    //   addProperty('text-align', attr('textAlign')?.[lg]),
    //   textBoxShadow(attr('textShadow'))
    // )),

    replaceMediaQuery(lg, true),
    // ======= Tablet =======
    setMediaQuery(width_md, replaceMediaQuery(md, false)),
    // ======= Mobile =======
    setMediaQuery(width_sm, replaceMediaQuery(sm, false)),
  ))
};

Styles.propTypes = propTypes;

export default Styles;
