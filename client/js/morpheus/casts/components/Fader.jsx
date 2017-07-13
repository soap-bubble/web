import React from 'react';
import cn from 'classnames';

export const decorate = ((fromComponent, toComponent) => {
  return class Transition extends React.PureComponent {
    constructor(props) {
      super(props);
      this.state = {
        transitioned: false,
      };
    }

    componentDidMount() {
      const onTransitionEnd = (event) => {
        if (event.propertyName === 'opacity') {
          this.refs.fromFader.removeEventListener('transitionend', onTransitionEnd);
          this.setState({
            transitioned: true,
          });
        }
      };
      this.refs.fromFader.addEventListener('transitionend', onTransitionEnd);
      console.log('mounted', fromComponent, toComponent)
      setTimeout(() => {
        if (!this.refs.fromFader) {
          console.log(fromComponent, toComponent);
          debugger;
        }
        this.refs.fromFader.classList.add('fadeOut')
      });
    }

    render() {
      const { transitioned } = this.state;
      return (
        <div>
          <div ref="toFader" className={cn('fader')}>
            {toComponent}
          </div>
          <div ref="fromFader" className={cn('fader', transitioned ? 'hidden' : null)}>
            {fromComponent}
          </div>
        </div>
      );
    }
  };
});
