
export default function () {
  function isGranted(scope, user) {
    if (user.admin) {
      return true;
    }
    return false;
  }
  return {
    isGranted,
  };
}
