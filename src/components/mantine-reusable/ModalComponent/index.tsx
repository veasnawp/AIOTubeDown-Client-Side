import { ActionIcon, Button, Card, Modal, ModalProps, ScrollArea, Title } from "@mantine/core"
import { useSetState } from "@mantine/hooks"
import { IconX } from "@tabler/icons-react"


export type ModalManagerState = {
  title?: React.ReactNode
  children?: React.ReactNode
  propsTitle?: React.ComponentProps<typeof Title>
  topRightCloseButton?: boolean
  childrenWithScrollArea?: boolean
  renderFooter?: (footer: ({children}:{children: React.ReactNode}) => React.ReactNode) => React.ReactNode
}

export function useModalState(){
  const defaultStateModalManager = {
    title: '',
    propsTitle: {},
    topRightCloseButton: true,
    childrenWithScrollArea: false,
    children: '',
    renderFooter: undefined
  } as ModalManagerState;
  
  const [stateModalManager, setStateModalManager] = useSetState({
    opened: false, ...defaultStateModalManager
  });
  const openModalManager = (state: Partial<typeof stateModalManager>) => setStateModalManager({opened: true, ...state});
  const closeModalManager = () => setStateModalManager({opened: false, ...defaultStateModalManager});
  
  return { 
    defaultStateModalManager, stateModalManager, 
    setStateModalManager, openModalManager, closeModalManager 
  } as const
}

interface ModalManagerProps extends Omit<ModalManagerState,'children'>, ModalProps {}
export function ModalComponent({
  title,
  propsTitle,
  topRightCloseButton,
  childrenWithScrollArea,
  renderFooter,
  children,
  ...props
}: ModalManagerProps){

  const Footer = ({children}:{children: React.ReactNode}) => {
    return (
      <Card className='sticky bottom-0 z-10 border-t-[2px] dark:border-t-[1px] dark:border-gray-600'>
        <div className='shadow-sm'></div>
        <div className='flex justify-between'>
          <Button variant='filled' color='red'
            onClick={props.onClose}
          >Close</Button>
          {children}
        </div>
      </Card>
    )
  }
  return (
    <Modal
      size="md" centered 
      withCloseButton={false} zIndex={209}
      classNames={{
        body: 'p-0',
        content: 'overflow-hidden bg-[var(--web-wash)]'
      }}
      {...props}
      
    >
      <Card className='sticky top-0 z-10 -mt-4 mb-4 -mx-4 shadow-sm' p={8}>
        <Title component={'h3'} lh={'h3'} fz={'h3'} ta="center" {...propsTitle}>
          {title}
        </Title>
      </Card>
      { topRightCloseButton && <div className=' absolute top-1 right-1 z-20' title='Close'>
        <ActionIcon color='red' radius={'100%'} size={20}
          onClick={props.onClose}
        ><IconX/></ActionIcon>
      </div>}
      {
        childrenWithScrollArea
        ? <ScrollArea className='grow' h={'calc(100vh - 125px)'}>
            {children}
          </ScrollArea>
        :
          <>{children}</>
      }
      {
        renderFooter?.(Footer)
      }
    </Modal>
  )
}