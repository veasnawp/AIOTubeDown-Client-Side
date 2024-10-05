export const dataProducts = [
  {
    productName: "AIOTubeDown",
    productId: "MT-0001",
    slug: 'aiotubedown',
    category: 'Media Tools',
    description: "Unlimited Download and convert HD, 2k, 4k, 8k videos from YouTube and other popular websites like Facebook, Instagram, TikTok, Vimeo, DailyMotion... and support any chinese social media sites ( Douyin, Kuaishou... )",
    dashboardTab: '#download'
  },
  // {
  //   productName: "Mini Editor Tool",
  //   productId: "MT-0002",
  //   slug: 'mini-editor-tool',
  //   category: 'Media Tools',
  //   description: "Video Editor software for everyone and best for MMO",
  //   dashboardTab: '#editor'
  // },
] as const;

declare global {
  type DataProduct = (typeof dataProducts)[number]
}

export function getNewExpireDate(pricePlan:string){
  const plan = pricePlan.toLowerCase()
  const addMonth = plan.includes("lifetime") ? "9999" : plan.replace(/\D/g, "")
  let newExpiredDate: string;
  if(plan.includes("day")){
    const days = plan.replace(/\D/g, "")
    newExpiredDate = addDays(Number(days))
  } else if(plan.includes("year")) {
    const months = Number(addMonth) * 12
    newExpiredDate = addMonths("", months)
  } else {
    const months = Number(addMonth)
    newExpiredDate = addMonths("", months)
  }
  return newExpiredDate;
}

export function getActivationDays(startDate:number | string | Date, endDate:number | string | Date){
  // startDate or endDate "2023-08-29"
  const date1 = new Date(startDate);
  const date2 = new Date(endDate);
  const Difference_In_Time = date2.getTime() - date1.getTime();
  const activationDays = Difference_In_Time / (1000 * 3600 * 24);

  return Number(activationDays.toFixed())
}
export function addMonths(date?:Date|string, months?:number) {
  var d = date && typeof date === "object" ? date : new Date();
  d.setMonth(d.getMonth() + (months ?? 0));

  return d.toISOString();
}

export function addDays(dayOfTheMonth=0, newDate?: string) {
  var date = newDate ? new Date(newDate) : new Date();
  date.setDate(date.getDate() + dayOfTheMonth);
  return date.toISOString();
}