import {
  Menu,
} from 'electron';
import menuTemplate from './menuTemplate';

export default function () {
  if (process.env.NODE_ENV === 'development') {

  } else {
    Menu.setApplicationMenu(menuTemplate);
  }
}
