import { Accordion } from "@mantine/core";


interface PanelBodyProps {
  title?: React.ReactNode
  children?: React.ReactNode
  initialOpen?: boolean
}

export function PanelBody({
  title,
  children,
  initialOpen
}: PanelBodyProps) {
  const defaultValue = 'defaultValue';

  return (
    <Accordion defaultValue={initialOpen ? defaultValue : undefined}>
      <Accordion.Item value={defaultValue}>
        <Accordion.Control className=" bg-muted">{title}</Accordion.Control>
        <Accordion.Panel>{children}</Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item hidden value={'hidden'}>
      </Accordion.Item>
    </Accordion>
  );
}
