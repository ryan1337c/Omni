/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oaidalleapiprodscus.blob.core.windows.net",
      },
      {
        protocol: "https",
        hostname: "wpaysatiyftwgaoeubjh.supabase.co",
      },
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  outputFileTracingIncludes: {
    "/pages/api/generateResume": [
      "./markdown/preamble.md",
      "./markdown/resumeStruct.md",
    ],
  },
};

export default nextConfig;
