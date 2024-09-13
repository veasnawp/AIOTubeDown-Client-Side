import { Center, ColorInput, Menu } from '@mantine/core'
import { ResetValue } from '../ResetValueComponent';
import { useState } from 'react';
// import classes from './ColorControl.module.css'

export const defaultSwatchesColor = [
  '#2e2e2e', '#868e96', '#fa5252', '#e64980', 
  '#be4bdb', '#7950f2', '#4c6ef5', '#228be6', 
  '#15aabf', '#12b886', '#40c057', '#82c91e', 
  '#fab005', '#fd7e14'
]

type ColorInputProps = Prettify<React.ComponentProps<typeof ColorInput>>

interface ColorInputControlProps extends ColorInputProps {
  onReset?: () => void
}

// interface ColorInputControlProps extends ColorInputProps {
//   onReset?: () => void
// }

export const ColorInputControl = ({
  label = 'Pick Color',
  value,
  onChangeEnd,
  onReset,
  ...props
}: ColorInputControlProps) => {
  const [colorFormat, setColorFormat] = useState(value?.startsWith('rgba') ? 'rgba' : value?.startsWith('hsla') ? 'hsla' : 'hex')

  const labelText = label

  const defaultValue = "#020817";
  const colorInputProps = {
    format: colorFormat,
    closeOnColorSwatchClick: true,
    placeholder: "Pick color",
    swatches: [...defaultSwatchesColor],
    defaultValue, // foreground tailwind color
    popoverProps: {
      shadow: 'lg'
    },
    ...props,
    label: undefined,
    value: value || defaultValue,
    onChangeEnd,
  } as ColorInputProps

  return (
    <div className='blogger-block-color-picker-control space-y-1'>
      <ResetValue label={labelText} onReset={onReset} value={value} />
      <div className='flex gap-1'>
        <ColorInput
          className='grow'
          {...colorInputProps}
        />
        <Menu trigger="click" transitionProps={{ exitDuration: 0 }} withinPortal>
          <Menu.Target>
            <Center title='color type' className='border rounded-sm px-1 cursor-pointer'>
              <span className={'text-xs font-semibold text-nowrap'}>{colorFormat}</span>
            </Center>
          </Menu.Target>
          <Menu.Dropdown>
            {
              ["hex", "rgba", "hsla"].map((colorType) => (
                <Menu.Item key={colorType} 
                  className={'text-sm font-semibold aria-selected:bg-muted'}
                  aria-selected={colorFormat === colorType}
                  onClick={() => setColorFormat(colorType)}
                >
                  {colorType.toUpperCase()}
                </Menu.Item>
              ))
            }
          </Menu.Dropdown>
        </Menu>
        {/* <Select
          title='color type'
          w={100} fw={600}
          withCheckIcon={false}
          classNames={{
            input: 'p-0 text-center',
            option: 'aria-selected:bg-muted font-semibold text-sm',
          }}
          rightSectionProps={{
            hidden: true
          }}
          rightSectionWidth={0}
          rightSection={' '}
          value={colorFormat?.toUpperCase()}
          data={["hex", "rgba", "hsla"].map(v=>v.toUpperCase())}
          onChange={(val) => val && setColorFormat(val.toLowerCase())}
        /> */}
      </div>
    </div>
  )
}
