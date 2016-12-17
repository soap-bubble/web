import raf from 'raf';

export default function (renderer) {
  function renderDelegate() {
    raf(renderDelegate);
    renderer();
  }
  raf(renderDelegate);
}
