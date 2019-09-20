import { UAParser } from 'ua-parser-js'

const uas = new UAParser()
const result = uas.getResult()

export const isIOS =
  result &&
  result.browser &&
  result.browser.name &&
  result.browser.name.indexOf('Safari') !== -1 &&
  result.os.name === 'iOS'

export default result &&
  result.browser &&
  result.browser.name &&
  result.browser.name.indexOf('Safari') !== -1
