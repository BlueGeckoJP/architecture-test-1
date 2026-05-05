import { unauthorized } from "@/domain/errors";
import { getInternalApiKey } from "@/lib/api";

export function assertInternalAuthorization(request: Request) {
  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${getInternalApiKey()}`) {
    throw unauthorized();
  }
}
