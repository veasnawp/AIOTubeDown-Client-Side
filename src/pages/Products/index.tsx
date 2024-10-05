import { MainDashboard } from '../Dashboard/dashboard'
import { AIOTubeDownPage } from './AIOTubeDown'
import { Navigate, useParams } from 'react-router-dom';

export const ProductsPage = () => {
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

  return (
    <MainDashboard classNames={{
      inner: "*:shadow-none"
    }}>
      <currentPage.content />
    </MainDashboard>
  )
}
