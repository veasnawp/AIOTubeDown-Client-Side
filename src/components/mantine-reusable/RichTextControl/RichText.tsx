import { RichTextEditor, Link } from "@mantine/tiptap";
// import { useCurrentEditor } from '@tiptap/react'
import { Content, useEditor } from "@tiptap/react";
import Highlight from "@tiptap/extension-highlight";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Superscript from "@tiptap/extension-superscript";
import SubScript from "@tiptap/extension-subscript";
import Placeholder from "@tiptap/extension-placeholder";
import { Color } from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import { useEffect, useRef, useState } from "react";
import { ActionIcon, Tooltip } from "@mantine/core";
import { X } from "lucide-react";
import { defaultSwatchesColor } from "../ColorControl/color-input-control";

interface RichTextProps {
  componentProps?: Record<string,any>
  component?: string;
  value?: Content;
  onChange?: (value: string) => void
}

export function RichText({ value, onChange, component, componentProps }: RichTextProps) {
  const [isEditing, setIsEditing] = useState(false);

  const [isVisibleToolbar, setIsVisibleToolbar] = useState(true);

  const regex = /\<h(.*?)>(.*?)\<\/h(.*?)>/;
  const isTypeHeading = !!(component && component.startsWith('h') && component.length === 2);
  if(isTypeHeading && typeof value === 'string'){
    const h = component
    if(value) value = `<${h}>${value}</${h}>`
    value = value.match(regex)?.[0]
  }
  const isTypeCustomHTML = !!(component && component.startsWith('code') && component.length === 4);

  let extensions = [] as any[];
  if(isTypeCustomHTML){
    extensions = [
      StarterKit
    ]
  } else {
    extensions = [
      StarterKit.configure({
        heading: {
          HTMLAttributes: isTypeHeading ? {...componentProps, class: componentProps?.className} : undefined
        },
      }),
      Underline,
      Link,
      Superscript,
      SubScript,
      Highlight,
      Placeholder.configure({
        emptyEditorClass: isTypeHeading ? 'is-editor-empty text-3xl': 'is-editor-empty',
      }),
      TextAlign.configure({ types: isTypeHeading ? ["heading"] : ["heading", "paragraph"] }),
      Color,
      TextStyle
    ];
  }
  const editor = useEditor({
    extensions: extensions,
    content: value,
    onUpdate: ({editor}) => {
      let value = editor.getHTML();
      let valueJson = editor.getJSON();
      if(isTypeHeading){
        if(value.trim() !== '<p></p>' && value.trim().startsWith('<p') && value.trim().endsWith('</p>')){
          const regex = /\<p(.*?)>(.*?)\<\/p>/;
          const matches = value.match(regex);
          const content = matches?.[2]
          if(content && content?.length > 0){
            value = `<h1>${content}</h1>`
            editor.commands.setContent(value)
          }
        }
        const regex = /\<h(.*?)>(.*?)\<\/h(.*?)>/;
        const matches = value?.match(regex);
        value = matches?.[0] || value
        if(valueJson.content && valueJson.content.length > 1){
          editor.commands.setContent(value)
        } 
      } else if(isTypeCustomHTML) {
        value = editor.getText()
        if(value){
          if(value.length === 1){
            editor.commands.setContent(`<pre><code>${value}</code></pre>`)
          }
          value = `<pre><code>${value}</code></pre>`
        }
      } else {
        if(valueJson.content && valueJson.content.length === 1){
          const regex = /\<(.*?)>(.*?)\<\/(.*?)>/;
          const matches = value?.match(regex);
          if(matches && matches[2].length === 0){
            value = ''
          }
        }
      }
      onChange?.(value||'')
    },
    onTransaction: () => {
      setIsVisibleToolbar(true)
    },
    onBlur() {
      if(!isEditing){
        setIsVisibleToolbar(false)
      }
    },
  });

  // const refContent = useRef<HTMLDivElement>(null)

  useEffect(()=> {
    let value = editor?.getHTML();
    if(isTypeHeading && value){
      const regex = /\<h(.*?)>(.*?)\<\/h(.*?)>/;
      const matches = value?.match(regex);
      if(matches && matches.length > 0){
        const content = matches[0];
        value = content.replace(/\<h(1|2|3|4|5|6)/, `<${component}`).replace(/\<\/h(1|2|3|4|5|6)>/, `</${component}>`)
        onChange?.(value||'')
        editor?.commands.setContent(value||'')
      }
    }
  }, [component])
  

  const ControlsGroup = ({...props}) => <RichTextEditor.ControlsGroup
    // onClick={() => setContent({isEditing: true, value: content.isEditing ? 'any' : ''})}
    {...props}
  />

  return (
    <RichTextEditor editor={editor} withTypographyStyles={false}>
      <RichTextEditor.Toolbar sticky stickyOffset={60}
        onMouseEnter={() => setIsEditing(true)}
        onMouseLeave={() => {
          setIsEditing(false)
          if(isVisibleToolbar){
            editor?.chain().focus()
          }
        }}
        hidden={!isVisibleToolbar || isTypeCustomHTML}
      >
        { !isTypeCustomHTML &&
          <>
          <ControlsGroup>
            <RichTextEditor.Bold />
            <RichTextEditor.Italic />
            <RichTextEditor.Underline />
            <RichTextEditor.Strikethrough />
            <RichTextEditor.ClearFormatting />
            <RichTextEditor.Highlight />
            { !isTypeHeading && 
              <RichTextEditor.Code />
            }
          </ControlsGroup>

          <RichTextEditor.ColorPicker
            colors={defaultSwatchesColor}
          />

          <ControlsGroup>
            <RichTextEditor.H1 />
            <RichTextEditor.H2 />
            <RichTextEditor.H3 />
            <RichTextEditor.H4 />
            <RichTextEditor.H5 />
            <RichTextEditor.H6 />
          </ControlsGroup>

          { !isTypeHeading && 
            <ControlsGroup>
              <RichTextEditor.Blockquote />
              <RichTextEditor.Hr />
              <RichTextEditor.BulletList />
              <RichTextEditor.OrderedList />
              <RichTextEditor.Subscript />
              <RichTextEditor.Superscript />
            </ControlsGroup>
          }

          <ControlsGroup>
            <RichTextEditor.Link />
            <RichTextEditor.Unlink />
          </ControlsGroup>

          <ControlsGroup>
            <RichTextEditor.AlignLeft />
            <RichTextEditor.AlignCenter />
            <RichTextEditor.AlignJustify />
            <RichTextEditor.AlignRight />
          </ControlsGroup>

          <ControlsGroup>
            <RichTextEditor.Undo />
            <RichTextEditor.Redo />
          </ControlsGroup>
          
          <ActionIcon variant="outline" color="pink.5" size={24} radius={6}
            onClick={() => setIsVisibleToolbar(false)}
          >
            <Tooltip label="Hide Toolbar">
              <X/>
            </Tooltip>
          </ActionIcon>
          </>
        }

      </RichTextEditor.Toolbar>

      <RichTextEditor.Content 
        {...(!isTypeHeading && componentProps 
          ? {
            className: componentProps.className,
            id: componentProps.id,
          } : {})
        } 
      />
    </RichTextEditor>
  );
}


export function RichTextContent() {
  // const editor = useEditor({content: '<p>test</p>'})
  
  // console.log("========", editor?.contentComponent)
  return (
    <div content="<p>test</p>"></div>
  )
}