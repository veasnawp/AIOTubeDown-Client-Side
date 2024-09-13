import { useItems } from "@/contexts";
import { toCapitalized } from "@/utils";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import React from "react";


interface ResponsiveControlProps {
  label?: React.ReactNode
  children: (activeBreakpoint: DeviceType) => React.ReactNode
}

export default function ResponsiveControl({
  label,
  children,
}: ResponsiveControlProps) {

  const { device, setDevice } = useItems();
  const activeBreakpoint = device;

  const breakpoints = [
    { value: 'desktop', Icon: Monitor },
    { value: 'tablet', Icon: Tablet },
    { value: 'mobile', Icon: Smartphone },
  ];

  return (
    <div className={"pkb-responsive-control-wrap space-y-2"}>
      <div className="flex items-center justify-between gap-1">
        {label}
        <div className={"pkb-responsive-control-wrap-buttons flex items-center"}>
          {breakpoints.map(({value, Icon}) => (
            <button
              key={value}
              title={toCapitalized(value)}
              onClick={() => setDevice(value as any)}
              className={
                'pkb-responsive-control-wrap-button flex flex-col items-center justify-center p-0.5 rounded-sm'.concat(
                value === activeBreakpoint ? ' bg-blue-300' : '',
              )}
            >
              <Icon size={20}/>
            </button>
          ))}
        </div>
      </div>

      {children(activeBreakpoint)}
    </div>
  );
};