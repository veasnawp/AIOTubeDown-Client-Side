export const fileURI = (filepath: string) => {
  let file = filepath;
  if (['file://', 'atom://', 'file:///'].some((v) => file.trim().startsWith(v))) {
    file = file.replace(/(file:\/\/\/|file:\/\/|atom:\/\/)/g, '');
    // .replace(/file:\/\/\//g, '')
    // .replace(/atom:\/\//g, '');
  }
  return 'atom:///' + encodeURIComponent(`${file.replace(/\\/g, '/')}`);
};

export const resources = (path = '') => {
  const localSettings = localStorage.getItem('localSettings');
  const appPath = localSettings ? JSON.parse(localSettings).appPath : '';
  const resourcesPath = `${appPath}\\resources\\`;
  if(path.includes('/')){
    path = path.replace(/\//g, '\\')
  }
  if(path.startsWith('\\')){
    path = path.slice(1)
  }
  return resourcesPath + path;
};

export const resourceImage = (fileBasename = '') => {
  return resources('img\\' + fileBasename);
};

export const imageFileURI = (fileBasename = '') => fileURI(resourceImage(fileBasename));