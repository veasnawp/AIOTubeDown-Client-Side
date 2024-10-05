import { BrowserRouter as Router, Routes, Route, Outlet, Navigate, useNavigate, } from 'react-router-dom'
// import { Editor } from './pages/Editor'
// import { Dashboard } from './pages/Dashboard'

// import { Dashboard } from './pages/Dashboard'
import { LoginForm } from './pages/login'
import { useAuth } from './contexts'
import RequireAuth, { LoadRedirect } from './components/auth/require-auth';
import { GoogleOAuth } from './pages/oauth';
import { getAuthCode } from './api/blogger/google.connect'
import { MainInterface } from './pages/main'
import { LoadingOverlay } from '@mantine/core';
import { ipcRenderer, ipcRendererInvoke, isDesktopApp } from './App/electron/ipc';
import ProfilePage from './pages/Profile';
import { ProductsPage } from './pages/Products';
import ProductsLandingPage from './pages/Products/LandingPage';
import { NotFound } from './pages/notFound';
import AdminPage from './pages/Admin';
import { useEffect } from 'react';
import { MainDashboard } from './pages/Dashboard/dashboard';
import SingleDownloadPage from './pages/public/singleDownloadPage';


const DASHBOARD_ROUTE = '/dashboard';
const ADMIN_ROUTE = '/dashboard-admin';

function App() {
  const { isLoggedIn, isAdmin, user } = useAuth();
  const wLocation = window.location;
  const renderer = window.appASar?.renderer;

  const code = wLocation.search.includes('www.googleapis.com') ? getAuthCode(wLocation) : undefined;

  const dashboardRoute = DASHBOARD_ROUTE

  if(isDesktopApp && isLoggedIn && wLocation.pathname.startsWith("/oauth/next/")){
    // logger?.log("window.close()============")
    ipcRendererInvoke("webContents:send", "successful-login", JSON.stringify(wLocation));
  }

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Outlet />}>
            {/* public routes */}
            <Route path={"/"} element={
              isLoggedIn && user.role && user.provider
                ? <Navigate to={dashboardRoute} replace />
                : <SingleDownloadPage />
            } />
            <Route path={"refresh"} element={
              isLoggedIn
                ? <Navigate to={dashboardRoute + "?refresh=true"} replace />
                : <Navigate to={'/login'} replace />
            } />
            <Route path={"login"} element={
              isLoggedIn
                ? <Navigate to={dashboardRoute} replace />
                : <LoginForm />
            } />
            <Route path="register" element={
              isLoggedIn
                ? <Navigate to={dashboardRoute} replace />
                : <LoginForm />
            } />
            <Route path="oauth/next/login" element={
              isLoggedIn && !code
                ? <Navigate to={dashboardRoute} replace />
                : <GoogleOAuth wLocation={wLocation} authCode={code} />
            } />
            <Route path="oauth/next/signup" element={
              isLoggedIn
                ? <Navigate to={dashboardRoute} replace />
                : <GoogleOAuth wLocation={wLocation} isLoginPage={false} />
            } />

            {/* private routes */}
            <Route element={<RequireAuth isLoggedIn={isLoggedIn} />}>
              <Route path={DASHBOARD_ROUTE} element={<MainInterface />}></Route>
              <Route path={ADMIN_ROUTE} element={<AdminPage />}></Route>
              {/* <Route path='/post' element={<Editor />}></Route> */}
              {/* <Route path='add-income' element={<MainInterface />}></Route>
              <Route path='add-expense' element={<MainInterface />} ></Route> */}
              {/* <Route path='refresh' element={<RefreshPage />} /> */}
              <Route path='/account/:tabProfile' element={<ProfilePage />}></Route>
              <Route path='/products/:productName' element={<ProductsPage />}></Route>
            </Route>

            {/* products landing page routes */}
            <Route path='/tools/:productName' element={<ProductsPage />}></Route>
            {/* 404 — Not Found */}
            <Route path='/not-found' element={<NotFound />}></Route>

            {/* catch all */}
            <Route path="*" element={
              renderer 
              ? <Navigate to={dashboardRoute} replace />
              : <LoadRedirect to={'/not-found'} />
            } />
          </Route>
        </Routes>
      </div>
    </Router>
  )
  // return (
  //   <Router>
  //     <div className="app-container">
  //       <Routes>
  //         <Route path='/' element={<Dashboard />}></Route>
  //         <Route path='/dashboard' element={<Dashboard />}></Route>
  //         <Route path='/post' element={<Editor />}></Route>
  //       </Routes>
  //     </div>
  //   </Router>
  // )
}

export function RefreshPage(){
  const navigate = useNavigate();
  useEffect(()=>{
    setTimeout(()=>{
      navigate('/dashboard', { replace: true})
    },1000)
  },[])
  return (
    <>
    <MainDashboard
      classNames={{
        inner: "*:shadow-none"
      }}
    >
      <LoadingOverlay visible={true} zIndex={1000}
        overlayProps={{ radius: "sm", blur: 2 }}
        loaderProps={{ color: 'green', type: 'oval' }}
      />
    </MainDashboard>
    </>
  )
}

export default App;
