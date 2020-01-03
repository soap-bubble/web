
import cursor10001 from '../../../image/cursors/Bigarrow.png';
import cursor10011 from '../../../image/cursors/Card.png';
import cursor10008 from '../../../image/cursors/Open.png';
import cursor10009 from '../../../image/cursors/Closed.png';
import cursor10000 from '../../../image/cursors/Wheel.png';
import cursor10002 from '../../../image/cursors/Hand.png';
import cursor10003 from '../../../image/cursors/Tele.png';
import cursor10005 from '../../../image/cursors/Goback.png';
import cursor10007 from '../../../image/cursors/Down.png';
import cursor10010 from '../../../image/cursors/Tapest.png';
import cursor10004 from '../../../image/cursors/Micro.png';
import cursor10012 from '../../../image/cursors/Cur10012.png';
import cursor10013 from '../../../image/cursors/Cur10013.png';
import cursor10014 from '../../../image/cursors/Cur10014.png';
import cursor10015 from '../../../image/cursors/Cur10015.png';
import cursor10016 from '../../../image/cursors/Cur10016.png';
import cursor10017 from '../../../image/cursors/cur10017.png';
import cursor10018 from '../../../image/cursors/cur10018.png';
import cursor10019 from '../../../image/cursors/cur10019.png';
import cursor10020 from '../../../image/cursors/cur10020.png';
import cursor10021 from '../../../image/cursors/cur10021.png';
import cursor10022 from '../../../image/cursors/cur10022.png';
import cursor10023 from '../../../image/cursors/cur10023.png';
import cursor10024 from '../../../image/cursors/cur10024.png';

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
  10001: cursor10001,
  10011: cursor10011,
  10008: cursor10008,
  10009: cursor10009,
  10000: cursor10000,
  10002: cursor10002,
  10003: cursor10003,
  10005: cursor10005,
  10007: cursor10007,
  10010: cursor10010,
  10004: cursor10004,
  10012: cursor10012,
  10013: cursor10013,
  10014: cursor10014,
  10015: cursor10015,
  10016: cursor10016,
  10017: cursor10017,
  10018: cursor10018,
  10019: cursor10019,
  10020: cursor10020,
  10021: cursor10021,
  10022: cursor10022,
  10023: cursor10023,
  10024: cursor10024,
};
