import Header from "@/app/components/Header";

import LandingScrollGutter from "./LandingScrollGutter";

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <LandingScrollGutter />
      <Header />
      {children}
    </>
  );
}
