import { useEffect, useState } from 'react'
import Styles from './style'
import { useItems } from '@/contexts'
import { ColorInputControl } from '@/components/mantine-reusable/ColorControl/color-input-control'
import { AlignmentResponsiveControl } from '@/components/mantine-reusable/AlignmentControl/alignment-control'
import { TextShadowControl } from '@/components/mantine-reusable/TextShadow/text-shadow-control'
import { PanelBody } from '@/components/mantine-reusable/PanelBody'
import { ColorGradientControl } from '@/components/mantine-reusable/ColorControl/color-gradient-picker'


export const ParagraphControls = () => {
  const { contents, updateItems, currentItem } = useItems();
  const content = contents.filter(v => v.blockId === currentItem?.blockId)?.[0]
  const props = content?.props || {} as ItemComponent
  const attributes = (content?.attributes || {}) as AttributesProps;

  const { color, textAlign, textShadow } = attributes;
  
  useEffect(()=> {
    if(attributes){
      Styles(attributes)
    }
  },[contents])

  const onUpdateItems = (val: any, attrKey: keyof AttributesProps) => {
    if(attributes){
      attributes[attrKey] = val
      updateItems(content)
    }
  }

  const resetValue = (attrKey: keyof AttributesProps) => {
    delete attributes[attrKey]
    updateItems(content)
  }


  return (
    <>
    <div className='-mx-4'>
      <PanelBody title={"Content Settings"} initialOpen>
        <div className='space-y-4 mt-2'>
          <AlignmentResponsiveControl
            onReset={() => resetValue('textAlign')}
            value={textAlign as any}
            onChange={(val) => onUpdateItems(val, 'textAlign')} 
          />
        </div>
      </PanelBody>
      <PanelBody title={"Paragraph Settings"}>
        <div className='space-y-4 mt-2'>
          <ColorGradientControl
            onReset={() => resetValue('color')}
            value={color}
            onChange={(val) => {
              onUpdateItems(val, 'color')
            }}
          />
          <TextShadowControl
            onReset={() => resetValue('textShadow')}
            value={textShadow}
            onChange={(val) => onUpdateItems(val, 'textShadow')}
          />
        </div>
      </PanelBody>
    </div>
    </>
  )
}
