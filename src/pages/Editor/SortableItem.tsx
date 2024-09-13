import React from 'react';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import { Box, BoxComponentProps, PolymorphicComponentProps } from '@mantine/core';
import clsx from 'clsx';


// interface SortableItemProps extends Omit<BoxComponentProps, 'id'> {
//   id: string | number
// }

export type ItemComponentProps = Omit<PolymorphicComponentProps<string, BoxComponentProps>, 'id'>

type SortableItemProps = Omit<PolymorphicComponentProps<string, BoxComponentProps>, 'id'|'component'> & {
  id: string | number
  blockId: string
  addClassName?: string
  component?: keyof React.JSX.IntrinsicElements
}


export function SortableItem({id, blockId, addClassName, ...props}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({id: id});
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    outline: isDragging ? '1px solid var(--mantine-color-blue-4)' : '',
    borderRadius: isDragging ? '4px' : ''
  };

  if(props){
    props.className = clsx(props?.className, addClassName, 'group-hover:[outline:1px_solid_var(--mantine-color-blue-4)] rounded-sm cursor-default')
    if(props.component === 'code'){
      props.component = 'div'
    }
  }
  
  return (
    <Box id={'block__' + blockId} ref={setNodeRef} style={style} {...attributes} {...listeners}
      {...(props as any)}
    />
  );
}