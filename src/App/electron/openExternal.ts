import { ipcRendererInvoke } from "./ipc";

interface ResultProps extends Record<string, any> {
}

interface OpenExternalProps {
  url: string | URL;
  options?: any;
  callback?: (result: Prettify<ResultProps>) => void;
  error?: (error: any) => void;
}

export const openExternal = ({
  url,
  options,
  callback,
  error
}: OpenExternalProps) => {
  try {
    ipcRendererInvoke("open-external", url, options)
    .then(callback)
    .catch(error);
  } catch {}
};
