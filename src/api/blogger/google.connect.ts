/* eslint-disable no-cond-assign */
/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/no-explicit-any */
import logger from "@/helper/logger";
import { GetToken } from "../interfaces/google";
import {
  API_KEY,
  CLIENT_ID,
  CLIENT_SECRETS,
  DISCOVERY_DOC,
  SCOPES,
} from "./variables";
import axios from "axios";

export async function gapiLoaded() {
  return await window.gapi.load("client:auth2", initializeGapiClient);
}

/**
 * Callback after the API client is loaded. Loads the
 * discovery doc to initialize the API.
 */
async function initializeGapiClient() {
  return await window.gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: [DISCOVERY_DOC],
  });
}

export function accessTokenRedirect(to: "signup" | "login", cb?:(oauthUrl:string)=>void) {
  const googleOAuth2 = {
    scope: 'openid+email+profile',
    state: "state_parameter_passthrough_value",
    redirect_uri: `${window.location.origin}/oauth/next/${to}`,
    include_granted_scopes: "true",
    response_type: "token",
    client_id: CLIENT_ID,
  };
  const googleOAuth2_uri = Object.entries(googleOAuth2)
    .map(([key, value]) => {
      return `${key}=${value}`;
    })
    .join("&");

  const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${googleOAuth2_uri}`;
  if(cb){
    cb(oauthUrl)
  } else {
    window.location.href = oauthUrl;
  }
}

export function accessTokenRedirectTypeOffline(to: "signup" | "login") {
  const googleOAuth2 = {
    // scope: "email+profile+https://www.googleapis.com/auth/blogger",
    scope: SCOPES.join("+"),
    state: "state_parameter_passthrough_value",
    redirect_uri: `${window.location.origin}/oauth/next/${to}`,
    access_type: "offline",
    // include_granted_scopes: "true",
    response_type: "code",
    client_id: CLIENT_ID,
  };
  const googleOAuth2_uri = Object.entries(googleOAuth2)
    .map(([key, value]) => {
      return `${key}=${value}`;
    })
    .join("&");

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${googleOAuth2_uri}`;
}

type AccessTokenProps = {
  code: string
  from?: "signup" | "login";
  onSuccess?: (
    data: GetToken,
    credential?: string
  ) => any|void;
  onError?: (err: Error) => void
};

export function getAuthCode(wLocation: Location){
  const fragmentString = wLocation.search.substring(1);
  const params = {} as Record<"code" | (string&{}), string>;
  const regex = /([^&=]+)=([^&]*)/g
  var m;
  while ((m = regex.exec(fragmentString))) {
    params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
  }
  if (
    !(Object.keys(params).length > 0 &&
    wLocation.search.includes("www.googleapis.com") && params.code)
  ){
    return
  }

  return params.code
}

export async function getAccessToken({ code, from, onSuccess, onError }: AccessTokenProps) {
    localStorage.setItem("auth_code", code);

    const url = "https://oauth2.googleapis.com/token";
    const data = {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRETS,
      code: code,
      grant_type: "authorization_code",
      redirect_uri: `${window.location.origin}/oauth/next/${from || 'login'}`,
    };

    return await axios
      .post(url, data, {
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
      })
      .then((response) => {
        const data: GetToken = response.data;
        logger?.log("data", data);
        if (data.access_token) {
          return onSuccess?.(data, data.id_token);
        }
      })
      .catch((err: Error) => {
        logger?.log("Error Data", err);
        onError?.(err)
        throw new Error(err.message);
      });
  
}

interface RefreshTokenProps {
  token: string
  onSuccess?: (data: GetToken) => void
  onError?: (err: Error) => void
}

export async function refreshToken({
  token,
  onSuccess,
  onError
}: RefreshTokenProps) {
  if (token) {
    const url = "https://oauth2.googleapis.com/token";
    const data = {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRETS,
      grant_type: "refresh_token",
      refresh_token: token,
    };

    return await axios
      .post(url, data, {
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
      })
      .then(async (response) => {
        const data: GetToken = await response.data;
        if (data.access_token) {
          window.gapi?.client?.setToken(data);
          onSuccess?.(data);
          // window.location.href = window.location.href
        }
      })
      .catch(async (err: Error) => {
        !onError && logger?.log("Error Data", err);
        onError?.(err);
        throw new Error(err.message);
      });
  }
}
