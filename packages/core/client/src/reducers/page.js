import routeMap from '../routes';

export default  (state = routeMap['route/HOME'], action = {}) => (routeMap[action.type] || state);
