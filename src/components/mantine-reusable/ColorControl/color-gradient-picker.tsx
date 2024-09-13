import ColorPicker from "react-best-gradient-color-picker";
import { defaultSwatchesColor } from "./color-input-control";
import { ResetValue } from "../ResetValueComponent";
import { ColorSwatch, Popover } from "@mantine/core";

type ColorGradientProps = Prettify<React.ComponentProps<typeof ColorPicker>>;

interface ColorGradientControlProps extends ColorGradientProps {
  label?: React.ReactNode
  onReset?: () => void
}

export function ColorGradientControl({
  label = 'Pick Color',
  value,
  onChange,
  onReset,
  ...props
}: ColorGradientControlProps) {
  const defaultColor = "#020817"

  return (
    <div className="blogger-block-color-picker-control space-y-1">
      <div className="flex gap-2">
        <ResetValue label={label} onReset={onReset} value={value} />
        <Popover width={'fit-content'} position="right-start" shadow="md">
        <Popover.Target>
          <ColorSwatch className="shadow-md cursor-pointer" color={value || defaultColor} withShadow
            styles={{
              colorOverlay: {
                background: value
              },
            }}
          />
        </Popover.Target>
        <Popover.Dropdown className=" max-h-[480px] overflow-y-auto">
          <ColorPicker
            width={250}
            height={147}
            value={value || defaultColor}
            onChange={onChange}
            presets={defaultSwatchesColor}
            {...props}
          />
        </Popover.Dropdown>
      </Popover>
      </div>
    </div>
  );
}
