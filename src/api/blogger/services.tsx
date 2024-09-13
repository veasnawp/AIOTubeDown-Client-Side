import axios, { AxiosError, AxiosResponse }  from "axios";
import { API_KEY } from "./variables";
import { Schema$Blog, Schema$Post } from "../interfaces/bloggerapi/v3";

export interface BlogResponse {
  body?: any;
  headers?: HeadersInit;
  result?: any;
  status?: number;
  statusText?: string | null;
}

export const blogId = (blogId:string) => window.localStorage.setItem("blogId", blogId);
// const postId = '7104700854222919012';
// const url = `https://blogger.googleapis.com/v3/blogs/${blogId}/posts?key=${APIKEY}`;

const resources = {
  blogId: '178417558800622702',
  postId: '8168057863584729851',
}
const configuration = {
  ...resources,
  apiKey: API_KEY,
}

export const googleApi = window.gapi
export const BLOGGER = () => window.gapi?.client?.blogger
export const blogger = () => {
  return {
    blogs: BLOGGER().blogs,
    // blogUserInfos: Resource$Bloguserinfos;
    // comments: Resource$Comments;
    // pages: BLOGGER().pages,
    // pageViews: Resource$Pageviews;
    posts: BLOGGER().posts,
    // postUserInfos: Resource$Postuserinfos;
    // users: Resource$Users;
  }
}

export const bloggerService = async (
  resourceBlogger:Promise<BlogResponse>,
  callback?: (data: any, response: BlogResponse) => any,
  error?: (error: BlogResponse) => any
) => {

  if(typeof callback === 'function') {
    return resourceBlogger
    .then((res) => {
      if(res.status === 200) {
        const data = res.result

        return callback?.(data, res);
      }
    })
    .catch((err) => error?.(err))
    // .then(
    //   async function(response) {
    //     // console.log("Response", response);
    //     if()
    //     return await callback?.(response)
    //   },
    //   async function(err: Error) {
    //     console.error("Execute error", err);
    //     throw new Error(err.message)
    //   }
    // );
  } else {
    return resourceBlogger
  }
}

// export const bloggerService = async (options: GetBloggerDataProps) => {
//   const { blogId, type, body, callback } = options;

//   const apiUrl = `https://www.googleapis.com/blogger/v3/blogs/${blogId}/`
//     .concat(
//       type?.is ? type?.is + '/' + (type?.id||"") : "",
//       `?key=${API_KEY}`
//     )
//   const token = userData().token
//   const headers = {
//     headers: {
//       "Authorization": `Bearer ${token.access_token}`,
//       "Accept": "application/json",
//       "Content-Type": "application/json",
//     }
//   }

//   axios.post(apiUrl, body, headers)
//   .then((res) => {
//     if(res.status === 200) {
//       const data = res.data

//       return callback?.(data);
//     }
//   })
//   .catch((err) => endRequest(err))

// };


export interface BlogAPIConfiguration {
  blogId?: string;
  postId?: string;
  apiKey: string;
}

interface Schema$ResponseData extends Schema$Blog, Schema$Post {}
type GetBloggerDataProps = {
  url?: string;
  blogId?: string;
  type?: {
    is?: "posts" | "pages";
    id?: string;
  };
  query?: string;
  body?: any;
  callback?: (data: Schema$ResponseData) => Promise<Response> | any;
  error?: (error: AxiosError) => Promise<Error> | any
}

export const bloggerApi = (path?:string) => `http://localhost:8080/bg-json${path||""}`

export const getBloggerData = async ({
  url,
  blogId, type,
  query, // ?key={credential} | ?key={token} | ?key={credential}&token={access_token}
  callback,
  error,
}: GetBloggerDataProps) => {
  // const { blogId, type, callback } = options;
  const apiUrl = url ?? bloggerApi(`/v2/${blogId}/`.concat(
    type?.is ? type?.is + '/' + (type?.id||"") : "",
    query ?? ""
  ));
  // const apiUrl = url ?? `http://localhost:8080/bg-json/v1/${blogId}/`.concat(
  //   type?.is ? type?.is + '/' + (type?.id||"") : "",
  // );

  const headers = {
    headers: {
      Accept: "application/json",
    }
  }

  axios.get(apiUrl, headers)
  .then((res) => {
    if(res.status === 200) {
      const data = res.data

      return callback?.(data);
    }
  })
  .catch((err) => error?.(err))

};

export async function endRequest(data: AxiosResponse | Response){
  try {
    return data
  } catch (error) {
    console.log("Error endRequest", error)
    return error
  }
}

type useFetchManyDataProps = {
  urls?: string[];
  blogIds?: string[];
  type?: {
    is?: "posts" | "pages";
    id?: string;
  };
  query?: string;
  body?: any;
  callback?: (data: Schema$ResponseData[]) => Promise<Response> | any;
  error?: (error: AxiosError) => Promise<Error> | any
}

export async function useFetchMany({
  urls,
  blogIds, type,
  query, // ?key={credential} | ?key={token} | ?key={credential}&token={access_token}
  callback,
  error,
}: useFetchManyDataProps) {
  const apiUrls = urls ??
  blogIds?.map(blogId =>
    // `http://localhost:8080/bg-json/v1/${blogId}/`
    // .concat(
    //   type?.is ? type?.is + '/' + (type?.id||"") : "",
    // )
    bloggerApi(`/v2/${blogId}/`.concat(
      type?.is ? type?.is + '/' + (type?.id||"") : "",
      query ?? ""
    ))
  ) as string[];

  const headers = {
    headers: {
      Accept: "application/json",
    }
  }
  axios.all(
    apiUrls.map((url) =>
    axios.get(url, headers)
  ))
  .then(axios.spread((...responses) => {
    // Both requests are now complete
    const res = responses.filter(res => res.status === 200).map(res => res.data)
    return callback?.(res);
  }))
  .catch((err) => error?.(err))

}

// export async function useUpdateMany({
//   urls,
//   blogIds, type,
//   callback,
//   error,
// }: useFetchManyDataProps) {
//   const apiUrls = urls ??
//   blogIds?.map(blogId =>
//     `http://localhost:8080/bg-json/v1/${blogId}/`
//     .concat(
//       type?.is ? type?.is + '/' + (type?.id||"") : "",
//     )
//   ) as string[];
//   // const apiUrls = urls ??
//   // blogIds?.map(blogId =>
//   //   `https://www.googleapis.com/blogger/v3/blogs/${blogId}/`
//   //   .concat(
//   //     type?.is ? type?.is + '/' + (type?.id||"") : "",
//   //     `?key=${API_KEY}`
//   //   )
//   // ) as string[];
//   const body = {};
//   const headers = {
//     headers: {
//       Accept: "application/json",
//     }
//   }
//   axios.all(
//     apiUrls.map((url) =>
//     axios.put(url, body, headers)
//   ))
//   .then(axios.spread((...responses) => {
//     // Both requests are now complete
//     const res = responses.filter(res => res.status === 200).map(res => res.data)
//     return callback?.(res);
//   }))
//   .catch((err) => error?.(err))

// }


export const useFetchApi = getBloggerData