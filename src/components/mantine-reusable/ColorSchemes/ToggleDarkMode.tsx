import { ActionIcon, useMantineColorScheme, useComputedColorScheme } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import cx from 'clsx';
import classes from './ToggleDarkMode.module.css';

export const computedColorScheme = () => useComputedColorScheme('light', { getInitialValueInEffect: true }); 

export default function ToggleDarkMode() {
  const { setColorScheme } = useMantineColorScheme();
  const colorScheme = computedColorScheme();

  return (
    <ActionIcon
      title={colorScheme === 'light' ? 'switch to dark mode' : 'switch to light mode'}
      onClick={() => setColorScheme(colorScheme === 'light' ? 'dark' : 'light')}
      variant="transparent"
      // size="xl"
      aria-label="Toggle color scheme"
    >
      <IconSun className={cx(classes.icon, classes.light)} stroke={1.5} />
      <IconMoon className={cx(classes.icon, classes.dark)} stroke={1.5} />
    </ActionIcon>
  );
}