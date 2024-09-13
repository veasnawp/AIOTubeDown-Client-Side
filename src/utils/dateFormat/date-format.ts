export function formatDate(value?: string | number | Date, mask?:string){
  const date = value ? new Date(value) : new Date();
  return date.format(mask || 'yyyy-mm-dd')
}