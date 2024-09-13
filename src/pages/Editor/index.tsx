import React, { useState } from 'react'
import { AppShell, Burger, Button, ColorPicker, Select } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks';

import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import { App } from './App';
import { useItems } from '@/contexts';
import { HeadingControls } from '@/components/blocks/heading';
import { ParagraphControls } from '@/components/blocks/paragraph';


function SortableItem(props: {id: string}) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({id: props.id});
    
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };
    
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        {/* ... */}
      </div>
    );
  }
  

export const Editor = () => {
  const { contents, updateItems, currentItem, setCurrentItem, setIsEditing } = useItems()

  const [opened, { toggle }] = useDisclosure();

  const isTypeCustomHTML = currentItem?.props?.label === "Custom HTML";

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: currentItem && !isTypeCustomHTML ? 300 : 0,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Burger
          opened={opened}
          onClick={toggle}
          hiddenFrom="sm"
          size="sm"
        />
        <div>Logo</div>
      </AppShell.Header>

      <AppShell.Navbar py="md" className={'space-y-4 '.concat(currentItem && !isTypeCustomHTML ? '' : 'hidden')}>
        <div className='sticky top-0 z-[9] px-4 pb-4 -mb-4 bg-background shadow-sm'>
          <Button fullWidth variant='outline' color='pink'
            onClick={() => {
              if(currentItem){
                setIsEditing(false);
                setCurrentItem(undefined);
              }
            }}
          >Close</Button>
        </div>
        <div className='scrollbar-width-5 overflow-y-auto p-4'>
          {
            function(){
              let value = '' as React.ReactNode
              switch (currentItem?.props?.label) {
                case 'Heading':
                  value = <HeadingControls />
                  break;
                case 'Paragraph':
                  value = <ParagraphControls />
                  break;
              
                default:
                  break;
              }
              return value
            }()
          }
        </div>
      </AppShell.Navbar>

      <AppShell.Main>
        <div className='editor-styles-wrapper'>
          <App />
        </div>
      </AppShell.Main>
    </AppShell>
  )
}
