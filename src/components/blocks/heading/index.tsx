import { Select } from '@mantine/core'
import { useEffect, useState } from 'react'
import Styles from './style'
import { useItems } from '@/contexts'
import { ColorInputControl } from '@/components/mantine-reusable/ColorControl/color-input-control'
import { AlignmentResponsiveControl } from '@/components/mantine-reusable/AlignmentControl/alignment-control'
import { TextShadowControl } from '@/components/mantine-reusable/TextShadow/text-shadow-control'
import { PanelBody } from '@/components/mantine-reusable/PanelBody'
import { ColorGradientControl } from '@/components/mantine-reusable/ColorControl/color-gradient-picker'


export const HeadingControls = () => {
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
          <div className='flex items-center justify-between'>
            <label className="blogger-block-label text-sm font-semibold text-nowrap">{"Select Heading"}</label>
            <Select
              w={80} fw={600}
              classNames={{
                option: 'aria-selected:bg-muted font-semibold',
              }}
              title='Select Heading'
              placeholder="H1"
              value={(props.component as string)?.toUpperCase()}
              data={['H1', 'H2', 'H3', 'H4', 'H5', 'H6']}
              onChange={(val) => {
                if(props && val){
                  props.component = val.toLowerCase() as typeof props.component
                  updateItems(content)
                }
              }}
            />
          </div>
          <AlignmentResponsiveControl
            onReset={() => resetValue('textAlign')}
            value={textAlign as any}
            onChange={(val) => onUpdateItems(val, 'textAlign')} 
          />
          {/* <AlignmentControl
            onReset={() => resetValue('textAlign')}
            value={textAlign as string} 
            onChange={(val) => onUpdateItems(val, 'textAlign')} 
          /> */}
        </div>
      </PanelBody>
      <PanelBody title={"Heading Settings"}>
        <div className='space-y-4 mt-2'>
          {/* <ColorInputControl
            onReset={() => resetValue('color')}
            value={color}
            onChange={(val) => {
              onUpdateItems(val, 'color')
            }}
          /> */}
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
