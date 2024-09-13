import { ColorPicker, Select } from '@mantine/core'
import { ResetValue } from '../ResetValueComponent';
import React, { useState } from 'react';
import { defaultSwatchesColor } from './color-input-control';
// import classes from './ColorControl.module.css'

type ColorPickerProps = Prettify<React.ComponentProps<typeof ColorPicker>>

interface ColorPickerControlProps extends ColorPickerProps {
  label?: React.ReactNode
  onReset?: () => void
}


export const ColorPickerControl = ({
  label = 'Pick Color',
  value,
  onChangeEnd,
  onReset,
  ...props
}: ColorPickerControlProps) => {
  const [colorFormat, setColorFormat] = useState('rgba')

  const labelText = label

  const colorPickerProps = {
    // fullWidth: true,
    format: colorFormat,
    placeholder: "Pick color",
    swatches: [...defaultSwatchesColor],
    defaultValue: "#020817", // foreground tailwind color
    ...props,
    value: value,
    onChangeEnd,
  } as ColorPickerProps

  return (
    <div className='blogger-block-color-picker-control space-y-1'>
      <div className='flex items-center justify-between gap-1'>
        <ResetValue label={labelText} onReset={onReset} value={value} />
        
        <Select
          title='color type'
          w={80}
          withCheckIcon={false}
          classNames={{
            input: 'p-0 text-center',
            option: 'aria-selected:bg-muted',
          }}
          rightSectionProps={{
            hidden: true
          }}
          rightSectionWidth={0}
          rightSection={' '}
          value={colorFormat}
          data={["hex", "rgba", "hsla"]}
          onChange={(val) => val && setColorFormat(val)}
        />
      </div>
      <div className='flex flex-col'>
        <ColorPicker
          {...colorPickerProps}
        />
      </div>
    </div>
  )
}
