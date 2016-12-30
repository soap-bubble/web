import raf from 'raf';
import EventEmitter from 'events';

const renderEvents = new EventEmitter();
renderEvents.once('newListener', () => {
  function render() {
    raf(render);
    renderEvents.emit('before');
    renderEvents.emit('render');
    renderEvents.emit('after');
  }
  raf(render);
});

export default renderEvents;
