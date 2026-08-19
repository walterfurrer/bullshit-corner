/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin_submissions from "../admin/submissions.js";
import type * as admin_topics from "../admin/topics.js";
import type * as admin_users from "../admin/users.js";
import type * as backfillClerkNames from "../backfillClerkNames.js";
import type * as lib_auth from "../lib/auth.js";
import type * as seed from "../seed.js";
import type * as submissions from "../submissions.js";
import type * as topics from "../topics.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "admin/submissions": typeof admin_submissions;
  "admin/topics": typeof admin_topics;
  "admin/users": typeof admin_users;
  backfillClerkNames: typeof backfillClerkNames;
  "lib/auth": typeof lib_auth;
  seed: typeof seed;
  submissions: typeof submissions;
  topics: typeof topics;
  users: typeof users;
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

export declare const components: {
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
