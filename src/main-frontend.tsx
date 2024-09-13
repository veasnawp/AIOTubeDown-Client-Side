import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import '@mantine/core/styles.css';
import '@mantine/tiptap/styles.css';
import './globals.css'
import './utils/dateFormat/index.ts'

import { createTheme, MantineProvider } from '@mantine/core';
// import { FinancialRecordProvider } from './contexts/financial-records.tsx'
import { AuthProvider } from './contexts/auth.tsx'
import { ItemsDragAndDropProvider } from './contexts/itemsDragAndDrop.tsx';
// import { gapiLoaded } from './api/blogger/google.connect.ts';

const theme = createTheme({
  /** Put your mantine theme override here */
});

// gapiLoaded();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
      <AuthProvider>
        <ItemsDragAndDropProvider>
          <App />
        </ItemsDragAndDropProvider>
      </AuthProvider>
    </MantineProvider>
  </React.StrictMode>,
)

{/* <script type="text/javascript">
  setTimeout(() => {
    const script = document.createElement('script')
    script.type = 'module'
    script.crossOrigin = true
    script.src = 'https://personal-money-tracker.vercel.app/assets/main.js'
    document.body.appendChild(script);
  }, 2000);
</script> */}