import example from './example';
import page from './page';
import scene1230 from '../../img/scene_1230.png';
import scene1050 from '../../img/scene_1050.png';
import scene3120 from '../../img/scene_3120.png';
import scene2350 from '../../img/scene_2350.png';

const initialState = {
  examples: {
    data: [{
      label: 'Exterior Bridge',
      url: '//morpheus.soapbubble.online/?scene=1050',
      img: scene1050,
    }, {
      label: 'Globe',
      url: '//morpheus.soapbubble.online/?scene=1230',
      img: scene1230,
    }, {
      label: 'Bedroom',
      url: '//morpheus.soapbubble.online/?scene=3120',
      img: scene3120,
    }, {
      label: 'Grand Stairway',
      url: '//morpheus.soapbubble.online/?scene=2350',
      img: scene2350,
    }]
  },
  page: {
    current: 'examples',
    navItems: [{
      name: 'about',
      label: 'About'
    }, {
      name: 'examples',
      label: 'Gallery'
    }],
  }
};

export default function (state = initialState, action) {
  return {
    examples: example(state.examples, action),
    page: page(state.page, action),
  };
}
