import { Divider } from "@mantine/core";
import { RotateCcw } from "lucide-react";

interface ResetValueProps {
  label?: string | React.ReactNode
  withLabel?: boolean
  title?: string
  disableDivider?: boolean
  value?: string | object | boolean
  onReset?: () => void
}

export const ResetValue = ({ 
  label, withLabel = true, 
  title = 'Reset',
  disableDivider = false,
  value, 
  onReset 
}: ResetValueProps) => {
  const ResetButton = () => <div title={title}><RotateCcw size={14} className="text-red-400 hover:text-red-600 cursor-pointer" onClick={onReset} /></div>

  return (
    label && withLabel ? (
      <div className="blogger-block-reset-value flex items-center justify-between grow gap-2">
        <label className="blogger-block-label text-sm font-semibold text-nowrap">{label}</label>
        {!disableDivider && <Divider variant="dashed" w={'100%'} px={30}/>}
        {value && typeof onReset === "function" && (
          <ResetButton />
        )}
      </div>
    ) : (
      value && typeof onReset === "function" && (
        <ResetButton />
      )
    )
  );
};
