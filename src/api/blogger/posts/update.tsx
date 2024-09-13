import axios, { AxiosResponse } from "axios";
import { Schema$Post } from "../../interfaces/bloggerapi/v3";
import { BlogResponse, blogger, bloggerApi, bloggerService, getBloggerData } from "../services"

interface UpdatePostProps {
  blogId?: string;
  postId?: string;
  requestBody?: Schema$Post;
  status?: string;
  publishDate?: string;
  oldPublishDate?: string;
  callback?: (data: any, response: BlogResponse | AxiosResponse<any, any>) => any,
  error?: (error: BlogResponse) => any
}

export async function scheduledPost({
  blogId,
  postId,
  status, publishDate, 
  oldPublishDate,
  callback,
  error
}: UpdatePostProps) {
  if(publishDate && oldPublishDate){
    const isValidDate = (publishDate > oldPublishDate);
    if(status?.toLowerCase() === "scheduled" && isValidDate) {
      return await bloggerService(
        blogger().posts.publish({
          blogId, postId, publishDate: publishDate
        })as Promise<BlogResponse>,
        callback,
        error
      )
    }

  }
}

export default async function updatePost({
  blogId,
  postId,
  requestBody,
  status, publishDate, 
  oldPublishDate,
  callback,
  error
}: UpdatePostProps) {
  return await bloggerService(
    blogger().posts.update({
      blogId,
      postId,
      resource: {
        ...requestBody
      },
      revert: ["scheduled","draft"].some(v => status?.toLowerCase() === v) ? true : false,
    }) as Promise<BlogResponse>,
    async (data, res) => {
      if(publishDate && oldPublishDate){
        const isValidDate = (publishDate > oldPublishDate);
        if(status?.toLowerCase() === "scheduled" && isValidDate) {
          console.log(publishDate, ' > ', oldPublishDate);
          console.log(isValidDate);
          await bloggerService(
            blogger().posts.publish({
              blogId, postId, publishDate: publishDate
            })as Promise<BlogResponse>
          )
        }
      }
      return await callback?.(data, res)
    },
    error
  )
  // return await getBloggerData({
  //   blogId: blogId,
  //   type: {
  //     is: "posts",
  //     id: postId,
  //   },
  //   callback: (body) => {
  //     console.log(body)
  //     bloggerService(
  //       blogger().posts.update({
  //         blogId, postId,
  //         requestBody: {
  //           ...body, ...requestBody
  //         }
  //       }) as Promise<BlogResponse>,
  //       callback,
  //       error
  //     )
  //   }
  // })
}

interface UpdateManyPostsProps {
  blogId?: string;
  postId?: string;
  access_token?: string;
  items?: Schema$Post[];
  status?: string;
  callback?: (data: any, response: BlogResponse | AxiosResponse<any, any>) => any,
  error?: (error: BlogResponse) => any
}

export async function updateManyPosts({
  blogId, // id=${postId1},${postId2},${...}
  postId,
  access_token,
  items, // [{Schema$Post}]
  // status, publishDate, oldPublishDate,
  callback,
  error
}: UpdateManyPostsProps){

  const url = bloggerApi(`/v2/${blogId}/posts?id=${postId}&key=${access_token}`);
  const body = {
    items
  };
  const headers = {headers: { Accept: "application/json" }}
  return await axios.put(url, body, headers)
  .then((res) => {
    if(res.status === 200) {
      const data = res.data

      return callback?.(data, res);
    }
  })
  .catch((err) => error?.(err))

}

