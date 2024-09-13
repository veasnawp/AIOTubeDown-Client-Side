import { Button, Slider, Tooltip } from '@mantine/core'
import { ResetValue } from '../ResetValueComponent';
import { useState } from 'react'
import { Edit2 } from 'lucide-react';
import { ColorInputControl } from '../ColorControl/color-input-control';
import { useClickOutside } from '@mantine/hooks';


interface TextShadowControlProps {
  label?: React.ReactNode
  value?: TextShadowValue
  onChange?: (value: TextShadowValue) => void
  onReset?: () => void
}


export const TextShadowControl = ({
  label = 'Text Shadow',
  value,
  onChange,
  onReset,
  // ...props
}: TextShadowControlProps) => {
  const [isVisible, setIsVisible] = useState(false);
	const toggleVisible = () => { setIsVisible(v => !v); };
  
  value = value || {};
  const { color } = value;
  const hasTextShadow = Object.values(value).filter(v=>v).length > 0

  const onTextShadowChange = (valueObj: TextShadowValue) => {
    const valueUpdate = {...value, ...valueObj}
    onChange?.(valueUpdate)
  }

  const ShadowPosition = (
    label: string, 
    valueKey: keyof Omit<TextShadowValue,'color'>, 
    min?: number
  ) => {
    const val = value?.[valueKey]
    const onReset = () => {
      onTextShadowChange({[valueKey]: undefined})
    }
		return (
      <div>
        <ResetValue label={label} onReset={onReset} value={!!val} />
        <Slider
          value={val || 0}
          onChange={(v) => valueKey && onTextShadowChange({[valueKey]: v})}
          min={min === 0 ? undefined : min || -100}
          step={1}
        />
      </div>
		)
	}

  const styleTextShadow = {
    border: '1px solid rgba(225, 48, 108, 0.1)', 
    borderRadius: '5px', 
    padding: '5px'
  };


  const [isEditing, setIsEditing] = useState(false);
  const ref = useClickOutside(() => !isEditing && setIsVisible(false));

  return (
    <div className='blogger-block-text-shadow-control space-y-2'>
      <div className='flex items-center justify-between gap-1 bg-muted' style={styleTextShadow}>
        <ResetValue label={label} title='Reset All'
          onReset={onReset}
          value={hasTextShadow} 
        />
        <div className="bgb-beside-color-click flex items-center" ref={ref}>
          <Tooltip label={'Click To Edit'} disabled={isVisible}>
            <Button
              p={0} w={34} h={34} radius={'100%'}
              className={`bgb-control-popup__options--action-button text-green-600 bg-white shadow-md hover:bg-green-100 hover:text-green-600`}
              onMouseDown={e => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={toggleVisible}
            ><Edit2 size={18}/></Button>
          </Tooltip>
        </div>
      </div>
      { isVisible &&
        <div className="bgb-text-shadow__popup bgb-control-popup space-y-4 outline outline-green-600/50 outline-1 rounded-md px-1.5 py-3.5 shadow-s1"
          onMouseOver={() => setIsEditing(true)}
          onMouseLeave={() => setIsEditing(false)}
        >
          <ColorInputControl
            onReset={() => onTextShadowChange({color: undefined})}
            value={color}
            onChange={(color) => onTextShadowChange({color})}
            swatchesPerRow={8}
          />
          {ShadowPosition('Offset-X', 'offSetX')}
          {ShadowPosition('Offset-Y', 'offSetY')}
          {ShadowPosition('Blur', 'blur', 0)}
        </div>
      }
    </div>
  )
}
