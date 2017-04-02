
import {
  resize,
} from './dimensions';
import {
  load as loadHotspots,
} from './hotspots';
import {
  getAssetUrl,
} from '../service/gamedb';
import {
  SPECIAL_START,
  SPECIAL_IS_LOADED,
  SPECIAL_END,
  SPECIAL_CANVAS,
  SPECIAL_HOTSPOTS_COLORLIST,
} from './types';

export function specialImgIsLoaded() {
  return {
    type: SPECIAL_IS_LOADED,
  };
}

export function specialHitCanvaseCreated(canvas) {
  return {
    type: SPECIAL_CANVAS,
    payload: canvas,
  }
}

const ORIGINAL_HEIGHT = 400;
const ORIGINAL_WIDTH = 640;
const ORIGINAL_ASPECT_RATIO = ORIGINAL_WIDTH / ORIGINAL_HEIGHT;

function clipRect({ width, height, top, left, right, bottom }) {
  if (width / height > ORIGINAL_ASPECT_RATIO) {
    const adjustedHeight = width / ORIGINAL_ASPECT_RATIO;
    const clipHeight = adjustedHeight - height;
    const widthScaler = width / ORIGINAL_WIDTH;
    const heightScaler = adjustedHeight / ORIGINAL_HEIGHT;
    const x = left * widthScaler;
    const sizeX = (right * widthScaler) - x;

    let y = (top * heightScaler) - (clipHeight / 2);
    let sizeY = (bottom - top) * heightScaler;

    if (y < 0) {
      sizeY += y;
      y = 0;
    } else if (y > height) {
      console.error('HOTSPOT IS OFFSCREEN!!!');
      sizeY -= (y - height);
      y = height;
    }
    if (y + sizeY > height) {
      sizeY = height - y;
    }

    return {
      x,
      y,
      sizeX,
      sizeY,
    };
  }
  const adjustedWidth = height * ORIGINAL_ASPECT_RATIO;
  const clipWidth = adjustedWidth - width;
  const widthScaler = adjustedWidth / ORIGINAL_WIDTH;
  const heightScaler = height / ORIGINAL_HEIGHT;
  const y = top * heightScaler;
  const sizeY = (bottom * heightScaler) - y;

  let x = (left * widthScaler) - (clipWidth / 2);
  let sizeX = (right - left) * widthScaler;
  if (x < 0) {
    sizeX += x;
    x = 0;
  } else if (x > width) {
    console.error('HOTSPOT IS OFFSCREEN!!!');
    sizeX -= (y - width);
    x = width;
  }
  if (x + sizeX > width) {
    sizeX = width - x;
  }

  return {
    x,
    y,
    sizeX,
    sizeY,
  };
}

export function generateHitCanvas(canvas) {
  return (dispatch, getState) => {
    const { width, height } = canvas;
    const { hotspots } = getState().special;
    let { hitColorList } = getState().special;
    if (hitColorList.length !== hotspots.length) {
      dispatch(generateHitColorList(hotspots));
      hitColorList = getState().special.hitColorList;
    }
    const ctx=canvas.getContext('2d');
    for (let i = hitColorList.length - 1; i >= 0; i--) {
      const color = hitColorList[i];
      const {
        rectTop: top,
        rectLeft: left,
        rectRight: right,
        rectBottom: bottom
      } = hotspots[i];
      const rect = clipRect({
        top,
        left,
        right,
        bottom,
        width,
        height,
      });
      //ctx.fillStyle = `#${color.toString(16)}`;
      ctx.color = 'black';
      ctx.lineWidth = 5;
      ctx.rect(
        rect.x,
        rect.y,
        rect.sizeX,
        rect.sizeY,
      );
    }
    ctx.stroke();
  };
}


export function generateHitColorList(hotspots) {
  const hitColorList = [];
  for (let i = 0, length = hotspots.length; i < length; i++) {
    let hitColor;
    while(!hitColor || hitColorList.indexOf(hitColor) !== -1) {
      hitColor = Math.floor(Math.random() * 0xFFFFFF);
    }
    hitColorList.push(hitColor);
  }
  return {
    type: SPECIAL_HOTSPOTS_COLORLIST,
    payload: hitColorList,
  };
}
//dispatch(generateHitColorList(hotspotsData));

export function display(sceneData) {
  return (dispatch) => {
    const { casts } = sceneData;
    const rootCast = casts.find(c => c.castId === sceneData.sceneId);
    const hotspotsData = casts.filter(c => c.castId === 0);
    const url = getAssetUrl(rootCast.fileName, 'png');
    dispatch(resize({
      width: window.innerWidth,
      height: window.innerHeight,
    }));
    dispatch(generateHitColorList(hotspotsData));
    dispatch({
      type: SPECIAL_START,
      payload: sceneData,
      meta: {
        url,
        hotspotsData,
      },
    });
  };
}
