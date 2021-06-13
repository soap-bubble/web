import qs from "query-string";

const qp =
  typeof global.window !== "undefined" &&
  typeof global.window.location !== "undefined"
    ? qs.parse(global.window.location.search)
    : {};

const isDebug =
  typeof global.window !== "undefined" &&
  typeof qp.debug !== "undefined" &&
  (qp.debug === null || qp.debug === "true");
const isDebugEnv = process.env.NODE_ENV === "development";

export default qp.debug !== "false" && (isDebug || isDebugEnv);
