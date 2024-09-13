import { MainDashboard } from '../Dashboard/dashboard'
import { AIOTubeDownPage } from './AIOTubeDown'
import { useEffectMainInterface } from '../main';
import { Navigate, useParams } from 'react-router-dom';
import { ContextMenu, useContextMenu } from "@/components/ContextMenu";

export const ProductsPage = () => {
  // useEffectMainInterface();
  // const { logOut } = useAuth();
  // const theme = useMantineTheme();
  let { productName } = useParams();
  const currentPath = productName || 'aiotubedown'

  const dataTabs = [
    {slug: "aiotubedown", content: AIOTubeDownPage},
    {slug: "mini-editor-tool", content: () => <div></div>},
  ];
  const currentPage = dataTabs.filter(dt => dt.slug === currentPath)?.[0]
  if(currentPage?.slug !== productName){
    return <Navigate to={'/products'} replace />
  }
  
  const { showContextMenu, points, onContextMenu } = useContextMenu();

  return (
    <MainDashboard classNames={{
      inner: "*:shadow-none"
    }}>
      <currentPage.content onContextMenu={onContextMenu} />
      <ContextMenu showContextMenu={showContextMenu} points={points}/>
    </MainDashboard>
  )
}
