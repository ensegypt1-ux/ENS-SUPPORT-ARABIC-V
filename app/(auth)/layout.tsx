import { AuthPortalChrome } from "@/components/auth/auth-portal-chrome";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthPortalChrome>{children}</AuthPortalChrome>;
}
