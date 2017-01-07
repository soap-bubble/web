import example from './example';
import page from './page';
import scene1230 from '../../img/scene_1230.png';
import scene1050 from '../../img/scene_1050.png';
import scene3120 from '../../img/scene_3120.png';
import scene2350 from '../../img/scene_2350.png';
import scene2620 from '../../img/scene_2620.png';
import scene3060 from '../../img/scene_3060.png';
import scene3910 from '../../img/scene_3910.png';
import scene7030 from '../../img/scene_7030.png';
import scene8010 from '../../img/scene_8010.png';
import scene100000 from '../../img/scene_100000.png';

const initialState = {
  examples: {
    data: [{
      label: 'Intro',
      url: '//morpheus.soapbubble.online/?scene=100000',
      img: scene100000,
    }, {
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
    }, {
      label: 'Ship Stern',
      url: '//morpheus.soapbubble.online/?scene=2620',
      img: scene2620,
    }, {
      label: 'Herbarium',
      url: '//morpheus.soapbubble.online/?scene=3060',
      img: scene3060,
    }, {
      label: 'Movie Theatre',
      url: '//morpheus.soapbubble.online/?scene=3910',
      img: scene3910,
    }, {
      label: 'Monkey Cave',
      url: '//morpheus.soapbubble.online/?scene=7030',
      img: scene7030,
    }, {
      label: 'Merry-go-round',
      url: '//morpheus.soapbubble.online/?scene=8010',
      img: scene8010,
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
