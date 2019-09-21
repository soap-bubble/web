import uasParser from 'ua-parser-js'

const userAgentString = (global.navigator && global.navigator.userAgent) || ''
const uas = uasParser(userAgentString)

export const isIOS =
  uas.browser.name &&
  uas.browser.name.indexOf('Safari') !== -1 &&
  uas.os.name === 'iOS'
export default uas.browser.name && uas.browser.name.indexOf('Safari') !== -1
