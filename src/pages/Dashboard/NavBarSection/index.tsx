import { useState } from "react";
import {
  IconGauge,
  IconFingerprint,
  IconActivity,
  IconChevronRight,
  IconSquareRoundedArrowDown,
} from "@tabler/icons-react";
import { alpha, Box, NavLink, useMantineTheme } from "@mantine/core";

const dataLabels = ["Dashboard", "Download", "Editor"] as const
const data = [
  { icon: IconGauge, label: dataLabels[0], description: "" },
  {
    icon: IconSquareRoundedArrowDown,
    label: dataLabels[1],
    rightSection: <IconChevronRight size="1rem" stroke={1.5} />,
  },
  { icon: IconActivity, label: dataLabels[2], maintenance: true },
].slice(1);

type LabelType = (typeof data)[number]['label'] | (string&{})
interface NavBarMenuProps {
  defaultActive?: LabelType
  onActiveChange?: (label: LabelType) => void
}

export function NavBarMenu({
  defaultActive,
  onActiveChange
}: NavBarMenuProps) {
  const theme = useMantineTheme();
  const [active, setActive] = useState(defaultActive || data[0].label);

  const items = data.map((item, i) => (
    <NavLink
      className={"group".concat(item.maintenance ? " !cursor-wait":"")}
      title={item.maintenance ? "See you soon. . ." : undefined} 
      bg={item.maintenance ? alpha(theme.colors.red[6],0.3) : undefined}
      c={item.maintenance ? 'gray.5' : undefined}
      onClick={() => {
        if(!item.maintenance)
        setActive(item.label); onActiveChange?.(item.label)}
      }
      href={item.maintenance ? undefined : "#".concat(item.label.replace(/ /g, "-").toLowerCase())}
      key={item.label}
      active={item.label === active}
      label={item.label}
      description={item.description}
      rightSection={
        <IconChevronRight className={"group-hover:block ".concat(item.label === active ? " block":"group-has-[svg]:hidden")} size="1rem" stroke={1.5} />
      }
      leftSection={<item.icon size="1.5rem" stroke={1.5} />}
      variant="filled"
      p={16}
      fw={600}
      styles={(theme) => ({ 
        root: { 
          borderTopRightRadius: i === 0 ? 4 : '',
          borderBottom: `1px solid ${alpha(theme.colors.gray[6], 0.1)}`,
        }, 
        label: { fontSize: 16, } 
      })}
    />
  ));

  return <>{items}</>;
}
