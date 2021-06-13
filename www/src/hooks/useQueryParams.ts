import { useRouter } from "next/router";

export default function useQueryParams() {
  const router = useRouter();
  return router.query;
}
