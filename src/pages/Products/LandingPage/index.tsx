// import { isDesktopApp } from "@/App/electron/ipc";
import { LoadRedirect } from "@/components/auth/require-auth";
import { useAuth } from "@/contexts";
import { Navigate, Outlet, useParams, } from "react-router-dom";

const ProductsLandingPage = () => {
  const { isLoggedIn } = useAuth();
  const { productName } = useParams();

  if(!productName){
    return <LoadRedirect to={"/products"} />
  }

  return isLoggedIn ? <Navigate to={"/products/" + productName} /> : <Outlet />
  // return (
  //   !isDesktopApp
  //     ? isLoggedIn ? <Navigate to={"/products/" + productName} /> : <Outlet />
  //     : <Navigate to={"/products/" + productName} />
  //     // : <Outlet />
  // );
}


export default ProductsLandingPage;