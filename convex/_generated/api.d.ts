/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin_feedback from "../admin/feedback.js";
import type * as admin_submissions from "../admin/submissions.js";
import type * as admin_topics from "../admin/topics.js";
import type * as admin_users from "../admin/users.js";
import type * as backfillClerkNames from "../backfillClerkNames.js";
import type * as communityRankings from "../communityRankings.js";
import type * as entries from "../entries.js";
import type * as feedback from "../feedback.js";
import type * as lib_auth from "../lib/auth.js";
import type * as preview from "../preview.js";
import type * as seed from "../seed.js";
import type * as submissions from "../submissions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "admin/feedback": typeof admin_feedback;
  "admin/submissions": typeof admin_submissions;
  "admin/topics": typeof admin_topics;
  "admin/users": typeof admin_users;
  backfillClerkNames: typeof backfillClerkNames;
  communityRankings: typeof communityRankings;
  entries: typeof entries;
  feedback: typeof feedback;
  "lib/auth": typeof lib_auth;
  preview: typeof preview;
  seed: typeof seed;
  submissions: typeof submissions;
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
