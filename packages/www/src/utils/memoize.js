const memoize = (func) => func;
export default memoize;
// export default func => memoize(func, s => s && s._id);
