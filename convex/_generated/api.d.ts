/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as lib_auth from "../lib/auth.js";
import type * as lib_hoc from "../lib/hoc.js";
import type * as lib_types from "../lib/types.js";
import type * as lib_utils from "../lib/utils.js";
import type * as system_conversations from "../system/conversations.js";
import type * as system_files from "../system/files.js";
import type * as system_projects from "../system/projects.js";
import type * as user_conversations from "../user/conversations.js";
import type * as user_files from "../user/files.js";
import type * as user_projects from "../user/projects.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "lib/auth": typeof lib_auth;
  "lib/hoc": typeof lib_hoc;
  "lib/types": typeof lib_types;
  "lib/utils": typeof lib_utils;
  "system/conversations": typeof system_conversations;
  "system/files": typeof system_files;
  "system/projects": typeof system_projects;
  "user/conversations": typeof user_conversations;
  "user/files": typeof user_files;
  "user/projects": typeof user_projects;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
