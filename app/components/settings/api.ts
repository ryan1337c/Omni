import { AuthServices } from "@/lib/authServices";
import { PublicServices } from "@/lib/publicServices";

export const authServices = new AuthServices();
export const publicServices = new PublicServices();

export async function postWithSession(url: string, body?: unknown) {
  const session = await authServices.getSession();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...(body !== undefined && { "Content-Type": "application/json" }),
      Authorization: `Bearer ${session.access_token}`,
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  const data = await response.json();

  return { response, data };
}
