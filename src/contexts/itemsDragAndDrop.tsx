import logger from "@/helper/logger";
import { ItemComponentProps } from "@/pages/Editor/SortableItem";
import React, { createContext, useEffect } from "react";
import { v4 as uuid } from 'uuid'



export interface ItemsDragAndDropContextType {
  contents: ItemsDragAndDrop[]
  setContents: React.Dispatch<React.SetStateAction<ItemsDragAndDrop[]>>
  addItem: (content: ItemsDragAndDrop['content'], props?: ItemsDragAndDrop['props'], attributes?: Record<string,any>) => ItemsDragAndDrop[]
  updateItems: (content: ItemsDragAndDrop) => ItemsDragAndDrop[]
  removeItem: (id: number) => ItemsDragAndDrop[]
  currentItem: ItemsDragAndDrop | undefined
  setCurrentItem: React.Dispatch<React.SetStateAction<ItemsDragAndDrop | undefined>>
  isEditing: boolean
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>
  device: DeviceType
  setDevice: (device: DeviceType) => void
}

type CurrentLabelEditing = 'Heading' | 'Paragraph' | 'Custom HTML' | (string&{})

declare global {
  type DeviceType = 'desktop'|'tablet'|'smartphone'
  interface ItemComponent extends Omit<ItemComponentProps,'component'>, Record<string,any> {
    component?: keyof React.JSX.IntrinsicElements
    label?: CurrentLabelEditing
  }
  type ItemsDragAndDrop = {
    id: number
    blockId: string
    content: React.ReactNode
    props?: Prettify<ItemComponent>
    attributes?: Record<string,any>
  }
  type ItemsDragAndDropContextProps = Prettify<ItemsDragAndDropContextType>
}

export const ItemsDragAndDropContext = createContext<
ItemsDragAndDropContextProps | undefined
>(undefined);


const setUserStorage = (user: UserPayload) => {
  localStorage.setItem("user", JSON.stringify(user));
}

export const ItemsDragAndDropProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [contents, setContents] = React.useState<ItemsDragAndDrop[]>(() => {
    return []
  });
  const [device, setDevice] = React.useState<DeviceType>('desktop');
  const [currentItem, setCurrentItem] = React.useState<ItemsDragAndDrop>();
  const [isEditing, setIsEditing] = React.useState(false);

  const addItem = (content: ItemsDragAndDrop['content'], props?: ItemsDragAndDrop['props'], attributes?: Record<string,any>) => {
    const blockId = uuid();
    attributes = {...attributes, blockId}
    const updateContents = [
      ...contents, {id: contents.length + 1, blockId, content, props, attributes}
    ]
    setContents(updateContents);
    return updateContents
  }

  const updateItems = (content: ItemsDragAndDrop) => {
    const updateContents = contents.map(v => v.id === content.id ? {...v, ...content} : v)
    setContents(updateContents);
    return updateContents
  }

  const removeItem = (id: number) => {
    const updateContents = contents.filter(v => v.id !== id)
    setContents(updateContents);
    return updateContents
  }

  return (
    <ItemsDragAndDropContext.Provider
      value={{
        contents, setContents, addItem, updateItems, removeItem,
        currentItem, setCurrentItem,
        isEditing, setIsEditing,
        device, setDevice
      }}
    >
      {children}
    </ItemsDragAndDropContext.Provider>
  );
}; 