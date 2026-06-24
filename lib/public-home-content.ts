import {
  DEFAULT_LANDING_CONTENT,
  normalizeLandingPageContent,
  type LandingPageContent,
} from "@/types/landing-page";

/** Static homepage shell content — edited in code, not via admin CMS. */
export function getPublicHomeContent(): LandingPageContent {
  return normalizeLandingPageContent(DEFAULT_LANDING_CONTENT);
}
