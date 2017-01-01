import example from './example';
import page from './page';

const initialState = {
  example: {},
  page: {
    current: 'examples',
    navItems: [{
      name: 'about',
      label: 'About'
    }, {
      name: 'examples',
      label: 'Examples'
    }],
  }
};

export default function (state = initialState, action) {
  return {
    example: example(state.example, action),
    page: page(state.page, action),
  };
}
