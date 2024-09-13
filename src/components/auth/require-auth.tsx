import { Outlet, } from "react-router-dom";

type RequireAuthProps = {
  isLoggedIn: boolean
}

const RequireAuth = (props: RequireAuthProps) => {
  const { isLoggedIn } = props
  // const location = useLocation();

  return (
    isLoggedIn
      ? <Outlet />
      : <LoadRedirect to="/login" />
      // : <Navigate to="/login" state={{ from: location }} replace />
  );
}

interface LoadRedirectProps {
  to: string
}
export const LoadRedirect = ({to}: LoadRedirectProps) => {
  window.location.href = window.origin.concat(to)
  return null
}

export default RequireAuth;