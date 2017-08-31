import React from 'react';
import cn from 'classnames';

export const decorate = (toComponent =>
class Transition extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      transitioned: false,
    };
  }

  componentDidMount() {
    const { toFader } = this;
    const onTransitionEnd = (event) => {
      if (event.propertyName === 'opacity') {
        toFader.removeEventListener('transitionend', onTransitionEnd);
      }
    };
    toFader.addEventListener('transitionend', onTransitionEnd);
    setTimeout(() => {
      toFader.classList.remove('fadeOut');
      toFader.classList.add('fadeIn');
    });
  }

  render() {
    return (
      <div ref={(c) => { this.toFader = c; }} className={cn('fader', 'fadeOut')}>
        {toComponent}
      </div>
    );
  }
  });
