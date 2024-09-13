import { AuthContextType } from "@/contexts/auth";
import { FinancialRecord as FinancialRecordType, FinancialRecordContextProps as FinancialRecordContextType } from "@/contexts/financial-records";
import type jQuery from "jquery";

import * as FileSystemAccess from 'wicg-file-system-access'


type UserPayLoadOptions = {
	machineId?: string
} & Record<string,any>

declare global {
	interface Window extends FileSystemAccess {
		// google: Google;
		// gapi: GoogleApi;
		// $: JQuery
    os: 'Windows' | 'Mac OS' | 'Linux' | 'iOS' | 'Android'
    isAndroid: boolean
    isIOS: boolean
    isMobile: boolean
	}
	type Prettify<T> = {
		[K in keyof T]: T[K]; // replace _
	} & {};
	interface Date {
		/**
		 * @param mask Following are the special characters supported. Any differences in meaning from ColdFusion's dateFormat and timeFormat functions are noted.
		 * @example new Date(1717288897702).format("yyyy-mm-dd, h:MM:ss TT") // output => 2024-06-02, 7:41:37 AM
		 * @link Read Docs: https://blog.stevenlevithan.com/archives/javascript-date-format
		 */
		format: (mask?: string, utc?: string) => string;
	}
	type FinancialRecordContextProps = Prettify<FinancialRecordContextType>;
	type FinancialRecord = Prettify<FinancialRecordType> & {};
	type AuthContextProps = Prettify<AuthContextType>
	type UserPayload = Prettify<{
		_id?: string;
		userId: string;
		name?: string;
		username: string;
		email: string;
		password?: string;
		avatar?: string;
		authentication?: {
			ip?: string
			sessionToken: string
			refreshToken: string
			withSocial?: boolean
		}
    role?: "admin" | "user"
    provider?: 'credentials' | 'oauth'
		licenses?: LicenseRecord[];
		records?: FinancialRecord[];
		options?: UserPayLoadOptions;
		error?: string | Error;
    token?: string
	}>
	type GoogleUserInfo = Prettify<{
		id: string;
		email: string;
		name: string;
		family_name: string;
		given_name: string;
		picture: string;
		verified_email: boolean;
		withSocial: boolean;
	}>;
}
