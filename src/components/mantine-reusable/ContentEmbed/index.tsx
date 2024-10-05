import { Box, BoxComponentProps, Flex, FlexProps, PolymorphicComponentProps } from "@mantine/core";
import { IconPlayerPlayFilled } from "@tabler/icons-react";
import React, { useEffect, useState } from "react";
import classes from "./ContentEmbed.module.css"
import { ipcRendererInvoke, isDesktopApp, localBackend } from "@/App/electron/ipc";
import axios from "axios";
import { defaultHeaders, localhostApi } from "@/api/backend/config";
import { cx } from "class-variance-authority";

type TablerIconsProps = React.ComponentProps<typeof IconPlayerPlayFilled>;

// interface ContentEmbedProps extends Omit<BoxProps, 'children'>, React.DOMAttributes<HTMLDivElement> {
interface ContentEmbedProps extends Omit<PolymorphicComponentProps<'div', BoxComponentProps>, 'children'> {
  children?: React.ReactNode;
  filePath?: string;
  url?: string;
  belowContent?: React.ReactNode;
  iconProps?: Prettify<TablerIconsProps>;
  mainProps?: Omit<PolymorphicComponentProps<'div', FlexProps>, 'children'>;
}

export const ContentEmbed = ({
  children,
  filePath,
  url,
  belowContent,
  iconProps,
  mainProps,
  ...props
}: ContentEmbedProps) => {
  const [active, setActive] = useState(false);
  const [hasFile, setHasFile] = useState(false);

  const isFilePath = Boolean(filePath && !filePath.trim().startsWith("http"))
  let resolveUseEffectMultiLoad = true;
  useEffect(() => {
    (async () => {
      if(active && resolveUseEffectMultiLoad) {
        resolveUseEffectMultiLoad = false;
        if (isFilePath){
          const data = await ipcRendererInvoke('file-exist', 'custom:' + filePath)
          setHasFile(Boolean(data));
        }
      } else {
        resolveUseEffectMultiLoad = true;
      }
    })()
  },[active]);

  props = {
    ...props,
    className: cx('content-embed', classes.box, props.className)
  }
  if(props.title?.startsWith('custom:')){
    props.title = props.title.replace('custom:','')
  } else {   
    if(!hasFile && props.title){
      props.title = "File has been not found"
    }
    if(!isDesktopApp && url){
      props.title = "Open Link: " + url
    }
  }

  return (
    <Flex pos={"relative"} align={"center"} miw={130} {...mainProps}>
      <Box
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => {
          setActive(false);
          setHasFile(false);
        }}
        onClick={async() => {
          if(isDesktopApp){
            if(hasFile){
              try {
                await axios.post(`${localBackend}/openfile`, {
                  file_path: filePath
                }, defaultHeaders)
              } catch {}
            }
          } else if(url) {
            window.open(url)
          }
        }}
        {...props}
      >
        <Box className={classes.playerWrapper} hidden={!hasFile}>
          <div className={classes.playerIcon}>
            <IconPlayerPlayFilled {...(iconProps||{})} />
          </div>
        </Box>
        {children}
      </Box>
      {belowContent}
    </Flex>
  );
};
