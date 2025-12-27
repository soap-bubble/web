
import { resolveAssetPath } from '../assets'

const cursorFrom = (fileName: string) =>
  resolveAssetPath(`image/cursors/${fileName}`)

export const CURSOR_IDS = {
  BIG_ARROW: 10001,
  CARD: 10011,
  OPEN: 10008,
  CLOSED: 10009,
  WHEEL: 10000,
  HAND: 10002,
  TELE: 10003,
  GO_BACK: 10005,
  DOWN: 10007,
  TAPESTRY: 10010,
  MICRO: 10004,
  RED_POTION: 10012,
  MAGNIFYING_GLASS: 10013,
  ROSE: 10014,
  FEATHER: 10015,
  FLAME: 10016,
  RED_PIN: 10017,
  PURPLE_PIN: 10018,
  YELLOW_PIN: 10019,
  BLUE_PIN: 10020,
  GREEN_PIN: 10021,
  PICKAXE: 10022,
  MONKEY: 10023,
  KEY: 10024,
};

export const CURSOR_NAMES = Object.keys(CURSOR_IDS).reduce((memo, name) => {
  // @ts-ignore
  memo[CURSOR_IDS[name]] = name;
  return memo;
}, {} as { [key: number]: string});

export const MORPHEUS_TO_CURSOR = {
  10001: cursorFrom('Bigarrow.png'),
  10011: cursorFrom('Card.png'),
  10008: cursorFrom('Open.png'),
  10009: cursorFrom('Closed.png'),
  10000: cursorFrom('Wheel.png'),
  10002: cursorFrom('Hand.png'),
  10003: cursorFrom('Tele.png'),
  10005: cursorFrom('Goback.png'),
  10007: cursorFrom('Down.png'),
  10010: cursorFrom('Tapest.png'),
  10004: cursorFrom('Micro.png'),
  10012: cursorFrom('Cur10012.png'),
  10013: cursorFrom('Cur10013.png'),
  10014: cursorFrom('Cur10014.png'),
  10015: cursorFrom('Cur10015.png'),
  10016: cursorFrom('Cur10016.png'),
  10017: cursorFrom('cur10017.png'),
  10018: cursorFrom('cur10018.png'),
  10019: cursorFrom('cur10019.png'),
  10020: cursorFrom('cur10020.png'),
  10021: cursorFrom('cur10021.png'),
  10022: cursorFrom('cur10022.png'),
  10023: cursorFrom('cur10023.png'),
  10024: cursorFrom('cur10024.png'),
};
