const cursor10001 = "/image/cursors/Bigarrow.png";
const cursor10011 = "/image/cursors/Card.png";
const cursor10008 = "/image/cursors/Open.png";
const cursor10009 = "/image/cursors/Closed.png";
const cursor10000 = "/image/cursors/Wheel.png";
const cursor10002 = "/image/cursors/Hand.png";
const cursor10003 = "/image/cursors/Tele.png";
const cursor10005 = "/image/cursors/Goback.png";
const cursor10007 = "/image/cursors/Down.png";
const cursor10010 = "/image/cursors/Tapest.png";
const cursor10004 = "/image/cursors/Micro.png";
const cursor10012 = "/image/cursors/Cur10012.png";
const cursor10013 = "/image/cursors/Cur10013.png";
const cursor10014 = "/image/cursors/Cur10014.png";
const cursor10015 = "/image/cursors/Cur10015.png";
const cursor10016 = "/image/cursors/Cur10016.png";
const cursor10017 = "/image/cursors/cur10017.png";
const cursor10018 = "/image/cursors/cur10018.png";
const cursor10019 = "/image/cursors/cur10019.png";
const cursor10020 = "/image/cursors/cur10020.png";
const cursor10021 = "/image/cursors/cur10021.png";
const cursor10022 = "/image/cursors/cur10022.png";
const cursor10023 = "/image/cursors/cur10023.png";
const cursor10024 = "/image/cursors/cur10024.png";

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
  memo[CURSOR_IDS[name as keyof typeof CURSOR_IDS]] = name;
  return memo;
}, {} as { [key: number]: string });

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
