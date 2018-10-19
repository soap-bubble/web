import { memoize } from 'lodash';

export default func => memoize(func, s => s && s._id);
