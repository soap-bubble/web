
export default function (createLogger) {
  const logger = createLogger('permissions');
  function isGranted(scope, user) {
    logger.info(`isGranted? ${scope} ${user._id} admin: ${user.admin}`);
    if (user.admin) {
      return true;
    }
    return false;
  }
  return {
    isGranted,
  };
}
