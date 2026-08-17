import { createClient } from "next-sanity";

// Server-only: requires SANITY_API_TOKEN (an "Editor" token generated at
// https://www.sanity.io/manage -> your project -> API -> Tokens). This must
// be a *different* env var from anything prefixed NEXT_PUBLIC_ - it should
// never be exposed to the browser.
export const sanityWriteClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});
