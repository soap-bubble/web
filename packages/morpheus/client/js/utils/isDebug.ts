import { isUndefined } from 'lodash';
import qs from 'query-string';

const qp = qs.parse(location.search);

const isDebug = !isUndefined(qp.debug) && (qp.debug === null || qp.debug === 'true');
const isDebugEnv = process.env.NODE_ENV === 'development';

export default qp.debug !== 'false' && (isDebug || isDebugEnv);
