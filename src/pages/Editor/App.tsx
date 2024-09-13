// import React, {useState} from 'react';
// import {DndContext, DragEndEvent, UniqueIdentifier} from '@dnd-kit/core';

// import {Droppable} from './Droppable';
// import {Draggable} from './Draggable';

// export function App() {
//   const containers = ['A', 'B', 'C'];
//   const [parent, setParent] = useState<UniqueIdentifier | null>(null);
//   const draggableMarkup = (
//     <Draggable id="draggable">Drag me</Draggable>
//   );

//   return (
//     <DndContext onDragEnd={handleDragEnd}>
//       {parent === null ? draggableMarkup : null}

//       {containers.length > 0 && containers.map((id) => (
//         // We updated the Droppable component so it would accept an `id`
//         // prop and pass it to `useDroppable`
//         <Droppable key={id} id={id}>
//           {parent === id ? draggableMarkup : 'Drop here'}
//         </Droppable>
//       ))}
//       {
//         containers.length <= 0 && (
//             <Droppable key={id} id={id}>
//                 {parent === id ? draggableMarkup : 'Drop here'}
//             </Droppable>
//         )
//       }
//     </DndContext>
//   );

//   function handleDragEnd(event: DragEndEvent) {
//     const {over} = event;

//     // If the item is dropped over a container, set it as the parent
//     // otherwise reset the parent to `null`
//     setParent(over ? over.id : null);
//   }
// };


import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import {ItemComponentProps, SortableItem} from './SortableItem';
import { useItems } from '@/contexts';
import { Edit, Plus, Trash, X } from 'lucide-react';
import { ActionIcon, Avatar, Box, Button, Input, Popover } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { RichText } from '@/components/mantine-reusable/RichTextControl/RichText';


interface AppProps {
  currentItem?: ItemsDragAndDrop
  setCurrentItem: React.Dispatch<React.SetStateAction<ItemsDragAndDrop | undefined>>
}

export function App() {
  const { 
    contents, setContents, addItem, removeItem, updateItems,
    currentItem, setCurrentItem, 
    isEditing, setIsEditing
  } = useItems();

  const [items, setItems] = useState(contents.map(item => item.id));
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [opened, { toggle, close }] = useDisclosure();

  const handleAddNewItem = (content: React.ReactNode, props?: ItemsDragAndDrop['props']) => {
    const contents = addItem(content, props)
    const item = contents.at(-1)
    setItems([...items, item?.id as number])
    if(item){
      setTimeout(() => {
        setIsEditing(true);
        setCurrentItem(item);
      },10)
    }
  }


  useEffect(()=> {
    console.log("contents",contents)
    console.log("items",items)
  },[contents])

  
  useEffect(()=> {
    console.log("currentItem",currentItem)
  },[currentItem])


  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      onDragOver={() => {
        if(currentItem){
          setIsEditing(false);
          setCurrentItem(undefined);
        }
      }}
    >
      <div className='flex gap-1'>
        <div className='grow'>
          <div className='space-y-3'>
          {
            items.length > 0 &&
              <>
              <SortableContext 
                items={items}
                strategy={verticalListSortingStrategy}
              >
                {items.map((id) => {
                  const item = contents[id-1] || {}

                  const isCurrentEditing = currentItem?.props?.label === item.props?.label;
                  return (
                    <div key={id} 
                      className={'relative group'.concat(
                        item.blockId === currentItem?.blockId ? 
                        ' outline outline-1 outline-blue-400 rounded-sm' : ''
                      )}
                      onBlur={() => !isEditing && setCurrentItem(undefined)}
                    >
                      {
                        isEditing && item.blockId === currentItem?.blockId
                        ?
                        <div className='relative'>
                          <RichText
                            // key='editable'
                            // tagName={item.props?.component as any}
                            componentProps={
                              item.props ? 
                              {...item.props, id: 'block__' + item.blockId} 
                              : undefined
                            }
                            component={item.props?.component}
                            value={item.content as string}
                            onChange={(value) => {
                              if(item.props?.component && item.props?.component?.startsWith('h')){
                                const level = value?.match(/<\/h(.*?)>/)?.[1]
                                if(level && ['1','2','3','4','5','6'].some(n => level === n)){
                                  item.props.component = `h${level}` as any
                                }
                                const regex = /\<h(.*?)>(.*?)\<\/h(.*?)>/;
                                const __content = value?.match(regex);
                                const content = __content?.[2]
                                if(content)
                                item.content = content;
                              } else {
                                item.content = value as string;
                              }
                              updateItems(item);
                            }}
                            // className={item.props?.className}
                            // placeholder={'Write something…'}
                          />
                          {/* <ContentEditable
                            key={id} id={'block__'+item.blockId}
                            {...(item?.props as any)}
                            content={item.content}
                            setContent={(val)=>{
                              item.content = val
                              updateItems(item);
                            }}
                          /> */}
                        </div>
                        : 
                        <SortableItem
                          key={id} id={id} blockId={item?.blockId}
                          {...(item?.props as any)}
                          // className=' bg-gray-50'
                          addClassName={
                            ['Paragraph','Custom HTML'].some(v => v === item.props?.label) 
                            && !item.content
                            ? 'flex items-center h-14 [outline:1px_solid_var(--mantine-color-gray-4)]' 
                            : item.content && ['Custom HTML'].some(v => v === item.props?.label)
                            ? " [outline:1px_solid_var(--mantine-color-gray-4)] p-2 bg-gray-50 max-h-[250px] overflow-y-scroll" : undefined
                          }
                          dangerouslySetInnerHTML={{
                            __html: (
                              item?.content && item.content !== '' ? (
                                item.content
                              ) : (
                                item?.props?.placeholder ? 
                                `<span class='text-gray-400'>${item?.props?.placeholder}</span>`
                                : ''
                              )
                            )
                          }}
                          />
                      }
                      <div className='absolute top-1 z-10 right-1 opacity-0 group-hover:opacity-100 group-hover:transition-all'>
                        <div className='flex flex-col gap-1'>
                          <ActionIcon
                            title={isCurrentEditing ? "Close" : "Edit " + item.props?.label}
                            key={`edit__${id}`}
                            className='group-hover:transition-all'
                            variant='outline' p={4}
                            onClick={() => {
                              if(isCurrentEditing){
                                setIsEditing(false);
                                setCurrentItem(undefined);
                              } else {
                                setTimeout(() => {
                                  setIsEditing(true);
                                  setCurrentItem(item);
                                },50)
                              }
                            }}
                          >{isCurrentEditing ? <X/> : <Edit/> }</ActionIcon>
                          <ActionIcon
                            title={"Remove " + item.props?.label}
                            key={`remove__${id}`}
                            className='text-red-600 group-hover:transition-all'
                            variant='outline' p={4} color='red'
                            onClick={() => {
                              setIsEditing(false);
                              setCurrentItem(undefined);
                              removeItem(id);
                              setItems(items.filter(v => v !== id))
                            }}
                          ><Trash/></ActionIcon>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </SortableContext>
              </>
          }
          </div>
        </div>
      </div>
      <Popover opened={opened} onChange={toggle} >
      <Popover.Target>
        <div className='flex items-center justify-center mt-4 w-full h-12 p-2 border border-dashed rounded-sm cursor-pointer hover:bg-blue-100 text-gray-600 hover:text-gray-700 hover:border-2' onClick={toggle}>
          <Plus size={28}/>
          <div className='sr-only'>Add New Block</div>
        </div>
      </Popover.Target>
      <Popover.Dropdown className='shadow-s1'>
        <div className='grid grid-cols-3 gap-2'>
          {
            [
              {
                label: 'Heading',
                onChange: () => {
                  const content = ''
                  const props = {
                    component: 'h1',
                    className: `blogger-block-advancedheading`,
                    label: 'Heading',
                    placeholder: 'Write something…',
                    // contentEditable: true
                  } as ItemsDragAndDrop['props']
                  handleAddNewItem(content, props)
                }
              },
              {
                label: 'Paragraph',
                onChange: () => {
                  const content = ''
                  const props = {
                    className: `blogger-block-paragraph`,
                    component: 'div', 
                    label: 'Paragraph',
                    placeholder: 'Write something…',
                  } as ItemsDragAndDrop['props']
                  handleAddNewItem(content, props)
                }
              },
              {
                label: 'Avatar',
                onChange: () => {
                  const content = <Avatar src={'/img/placeholder-user.webp'} />
                  const props = { label: 'Avatar'}  as any
                  handleAddNewItem(content, props)
                }
              },
              {
                label: 'Custom HTML',
                onChange: () => {
                  const content = ''
                  const props = {
                    className: `blogger-block-custom-html`,
                    component: 'code',
                    label: 'Custom HTML',
                    placeholder: 'Write something…',
                  } as ItemsDragAndDrop['props']
                  handleAddNewItem(content, props)
                }
              },
            ].map(item => {
              return (
                <Button key={item.label} variant='outline'
                  onClick={()=> {
                    item.onChange()
                    close()
                  }}
                >{item.label}</Button>
              )
            })
          }
        </div>
      </Popover.Dropdown>
    </Popover>
    </DndContext>
  );
  
  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    
    if (active.id !== over?.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id as number);
        const newIndex = items.indexOf(over?.id as number);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }
}


const ContentEditable = ({
  content='',
  setContent=(val:string) => {val},
  ...props
}) => {
  const defaultPlaceholder = !!content ? '' : 'write something...'
  const [placeholder, setPlaceholder] = useState(defaultPlaceholder);

  const onContentBlur = useCallback((e: React.FocusEvent<HTMLDivElement, Element>) => {
    setPlaceholder(defaultPlaceholder);
    setContent(e.currentTarget.textContent || "")
  }, [])
  
  return (
    <Box
      className=' focus-visible:outline-0'
      contentEditable
      onBlur={onContentBlur}
      onInput={(e) => {
        setPlaceholder('')
        if(!e.currentTarget.textContent){
          setContent(content)
        }
      }}
      // onClick={() => setActiveEditable(true)}
      dangerouslySetInnerHTML={{__html: content || (placeholder ? `<span class='text-gray-400'>${placeholder}</span>` : content)}}
      {...props}
    />
  )
}