import { isDesktopApp } from "@/App/electron/ipc";
import { LoadRedirect } from "@/components/auth/require-auth";
import { useAuth } from "@/contexts";
import { Navigate, Outlet, useParams, } from "react-router-dom";

const ProductsLandingPage = () => {
  const { isLoggedIn } = useAuth();
  const { productName } = useParams();

  if(!productName){
    return <LoadRedirect to={"/products"} />
  }

  return (
    !isDesktopApp
      ? isLoggedIn ? <Navigate to={"/products/" + productName} /> : <Outlet />
      : <LoadRedirect to={"/products/" + productName} />
  );
}


export default ProductsLandingPage;