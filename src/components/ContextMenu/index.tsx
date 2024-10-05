import { isDev } from "@/api/backend/config";
import { ipcRendererInvoke, isDesktopApp } from "@/App/electron/ipc";
import { Box, Card, Divider, Flex, Paper, Text } from "@mantine/core";
import { useEffect, useState } from "react";


export const useContextMenu = () => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [points, setPoints] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleClick = () => setShowContextMenu(false);
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("click", handleClick);
    };
  }, []);

  function onContextMenu(e: React.MouseEvent<HTMLDivElement, MouseEvent>){
    if(isDesktopApp) {
      e.preventDefault();
      setShowContextMenu(true);
      let x = e.pageX
      if(x >= 300){
        x = x - 300
      }
      setPoints({ x: x, y: e.pageY });
      // console.log("Right Click", e.pageX, e.pageY);
    } else {
      return undefined
    }
  }

  return { showContextMenu, setShowContextMenu, points, setPoints, onContextMenu }
}

interface ContextMenuProps {
  showContextMenu: boolean
  points: {x: number; y: number}
}
export const ContextMenu = ({
  showContextMenu, 
  points
}: ContextMenuProps) => {
  const isLoginPage = ['/login', '/register'].some(p => p === location?.pathname)

  return (
    (showContextMenu && isDesktopApp) ?
      <Paper id="contextMenu" pos={'absolute'} top={points.y} left={points.x} shadow='sm' style={{zIndex: 9999}} >
        <Card p={2} w={300} className='dark:bg-muted'>
          {function(){
            let dataContextMenu = [
              { label: 'Dev Tools', shortcut: 'Ctrl+D', separator: true,
                onClick: () => {
                  ipcRendererInvoke('dev-tools');
                },
              },
              { label: 'Zoom In', shortcut: 'Ctrl+-',
                onClick: () => {
                  if(isLoginPage){
                    ipcRendererInvoke("reset-zoom")
                  } else {
                    ipcRendererInvoke("zoom-in")
                  }
                },
              },
              { label: 'Zoom Out', shortcut: 'Ctrl++',
                onClick: () => {
                  if(isLoginPage){
                    ipcRendererInvoke("reset-zoom")
                  } else {
                    ipcRendererInvoke("zoom-out")
                  }
                },
              },
              { label: 'Reset Zoom', shortcut: 'Ctrl+0',
                onClick: () => {
                  ipcRendererInvoke("reset-zoom")
                },
              },
              { label: 'Reload', shortcut: 'Ctrl+R', separator: true,
                onClick: async () => {
                  let titleBarOverlay = {
                    color: "rgba(40, 49, 66, 0)",
                    symbolColor: "#ffffff",
                    height: 50 - 2,
                  }
                  await ipcRendererInvoke('toggle-color-scheme', titleBarOverlay);
                  window.location.href = window.location.origin
                },
              },
              { label: 'Exit', shortcut: 'Alt+F4',
                onClick: () => {
                  ipcRendererInvoke('CLOSE-APP');
                }
              },
            ];
            if(!isDev){
              dataContextMenu = dataContextMenu.slice(1)
            }
            return dataContextMenu.map((item, i) => {
              return (
                <Box key={`${item.label} ${i}`}>
                  <Box py={4} px={16} className='hover:bg-muted dark:hover:bg-gray-50/5 rounded-sm cursor-pointer select-none'
                    onClick={item.onClick}
                  >
                    <Flex justify={'space-between'}>
                      <Text span lineClamp={1}>{item.label}</Text>
                      <Text span>{item.shortcut}</Text>
                    </Flex>
                  </Box>
                  {item.separator && <Divider my={2} />}
                </Box>
              )
            })
          }()
          }
        </Card>
      </Paper>
    : <></>
  )
}
