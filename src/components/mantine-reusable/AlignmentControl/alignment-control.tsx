import { Center, SegmentedControl } from '@mantine/core'
import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react';
import { ResetValue } from '../ResetValueComponent';
import { useState } from 'react';
import ResponsiveControl from '../ResponsiveControl';

type AlignmentControl = Prettify<React.ComponentProps<typeof SegmentedControl>>

interface AlignmentControlProps extends Omit<AlignmentControl, 'data'> {
  label?: React.ReactNode
  disableDivider?: boolean
  onReset?: () => void
}

export const AlignmentControl = ({
  label = 'Alignment',
  disableDivider = false,
  value,
  onReset,
  ...props
}: AlignmentControlProps) => {
  const [defaultValue, setDefaultValue] = useState<string|undefined>('left');

  const segmentedControlProps = {
    fullWidth: true,
    ...props,
    value: value || defaultValue,
    defaultValue: 'left',
    data: [
      {
        value: 'left',
        label: <Center title='Text Align Left'><AlignLeft /></Center>,
      },
      {
        value: 'center',
        label: <Center title='Text Align Center'><AlignCenter /></Center>,
      },
      {
        value: 'right',
        label: <Center title='Text Align Right'><AlignRight /></Center>,
      },
    ],
  } as AlignmentControl

  const resetValue = () => {
    onReset?.()
    setTimeout(()=> setDefaultValue('left'),10)
  }

  return (
    <div className='blogger-block-alignment-control space-y-1'>
      {onReset && <ResetValue label={label} disableDivider={disableDivider} onReset={resetValue} value={value} />}
      <SegmentedControl
        {...segmentedControlProps}
      />
    </div>
  )
}


interface AlignmentResponsiveControlProps extends Omit<AlignmentControl, 'data' | 'value' | 'onChange'> {
  label?: React.ReactNode
  value: {[k in DeviceType]: string}
  onChange: (value: {[k in DeviceType]: string} | {}) => void
  onReset?: () => void
}

export const AlignmentResponsiveControl = ({
  label = 'Alignment',
  value,
  onChange,
  onReset
}: AlignmentResponsiveControlProps) => {
  const hasValue = value && Object.values(value).filter(v=>v).length > 0;

  return (
    <>
      <ResponsiveControl label={<ResetValue title='Reset All' label={label} value={hasValue} onReset={onReset} />}>
        {breakpoint => (
          <>
            <div className='pkb-alignment-toolbar w-full'>
              <AlignmentControl
                label={''}
                disableDivider
                // onReset={() => {
                //   onChange({
                //     ...value,
                //     [breakpoint]: undefined,
                //   });
                // }}
                value={breakpoint ? value?.[breakpoint] : undefined}
                onChange={(val) => {
                  onChange({
                    ...value,
                    [breakpoint]: val ? val : '',
                  });
                }}
              />
            </div>
          </>
        )}
      </ResponsiveControl>
    </>
  );
};