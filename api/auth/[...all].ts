import { auth } from "../../auth";

export const config = {
  runtime: "edge",
};

export default async function handler(request: Request) {
  return auth.handler(request);
}
