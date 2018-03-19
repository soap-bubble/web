import path from 'path';
import fs from 'fs';
import ioClient from 'socket.io-client';
import puppeteer from 'puppeteer';
import config from 'config';
import uuid from 'uuid';
import Promise from 'bluebird';
import {
  without,
  mapValues,
} from 'lodash';

Promise.promisifyAll(fs);

describe('playthrough', () => {
  let client;
  let channel;
  let browser;
  let page;
  let lastTest;

  const newBrowser = !process.env.NO_LAUNCH;

  function loadClient() {
    channel = uuid();
    client = ioClient(config.test.botEndpoint);
    return new Promise((resolve) => {
      client.on('connect', () => {
        client.emit('test', config.test.botToken, channel, () => {
          resolve();
        });
      });
    });
  }

  beforeAll(() => (newBrowser ? puppeteer.launch({
    headless: false,
  })
    .then((b) => {
      browser = b;
      return b.newPage();
    })
    .then((p) => {
      page = p;
      page.on('pageerror', (error) => {
        // eslint-disable-next-line no-console
        console.log('ERROR:', error);
      });
      return page.goto(config.test.launch, {
        waitUntil: 'networkidle2',
      }).then(() => Promise.delay(500));
    }) : Promise.resolve())
      .then(loadClient));
  afterAll(() => {
    client.disconnect();
    if (newBrowser) browser.close();
  });
  afterEach(() => {
    client.removeAllListeners(channel);
  });

  if (newBrowser) beforeAll(() => page.click('body'));

  function say(command) {
    return new Promise((resolve) => {
      client.emit(channel, command, resolve);
    });
  }

  function fileName(index) {
    return path.join(__dirname, `save${index.toString().padStart(3, '0')}.json`);
  }

  async function saveTest(index) {
    const save = await say('save');
    await fs.writeFileAsync(fileName(index), JSON.stringify(save, null, 2), 'utf8');
    expect({
      ...save,
      gamestates: mapValues(save.gamestates, g => without(g, '_id')),
    }).toMatchSnapshot();
    lastTest = index;
  }

  async function loadTest(index) {
    if (lastTest !== index) {
      const data = await fs.readFileAsync(fileName(index), 'utf8');
      await say(`load\n${JSON.stringify(JSON.parse(data))}`);
    }
  }

  describe('Breaching airlock', () => {
    it('go to flybridge', async () => {
      await say('go 200001');
      await say('wait 2040');
      await say('go 204001');
      await say('wait 1050');
    }, 30000);

    it('open cargo bay door', async () => {
      await say('go 105051');
      await say('slide 1000 10');
      await say('wait 105053');
    }, 30000);

    it('fall into cargo bay', async () => {
      await say('go 1050');
      await say('go 105001');
      await say('wait 2040');
      await say('go 204002');
      await say('wait 2090');
      await say('go 209005');
      await say('wait 2085');
      await say('go 208505');
      await say('wait 2011');
    }, 30000);

    it('go to 2nd floor', async () => {
      await say('go 201102');
      await say('wait 2010');
      await say('go 201020');
      await say('wait 201019');
      await say('slide 1010 5');
      await say('wait 202019');
    }, 30000);

    it('breach airlock', async () => {
      await say('go 202021');
      await say('wait 2020');
      await say('go 202002');
      await say('wait 2023');
      await say('go 202302');
      await say('wait 4000');
    }, 30000);

    it('go to 3rd floor', async () => {
      await say('go 400001');
      await say('wait 2054');
      await say('go 202301');
      await say('wait 2020');
      await say('go 202020');
      await say('wait 202019');
      await say('slide 1011 5');
      await say('wait 203019');
    }, 30000);

    it('leave cargo bay', async () => {
      await say('go 203021');
      await say('wait 2030');
      await say('go 203004');
      await say('wait 2034');
      await say('go 203415');
      await say('go 203416');
      await say('wait 2000');
    }, 30000);

    it('save', async () => await saveTest(0));
  });

  describe('Turn on lights', () => {
    it('load', async () => await loadTest(0));

    it('enter ballroom', async () => {
      await say('go 200104');
      await say('wait 2040');
      await say('go 204102');
      await say('wait 2091');
      await say('go 209002');
      await say('wait 2180');
      await say('go 218105');
      await say('wait 2251');
    }, 20000);

    it('enter grand staircase', async () => {
      await say('go 225103');
      await say('wait 2241');
      await say('go 224102');
      await say('wait 2261');
      await say('go 226112');
      await say('wait 2300');
      await say('go 230002');
      await say('wait 2310');
      await say('go 231005');
      await say('wait 2321');
    }, 45000);

    it('turn on lights', async () => {
      await say('go 232103');
      await say('wait 2331');
      await say('go 233101');
      await say('wait 3711');
      await say('go 371150');
      await say('go 371102');
      await say('wait 3710');
    }, 20000);

    it('save', async () => await saveTest(1));
  });

  describe('Enter engine room', () => {
    it('load', async () => await loadTest(1));

    it('see that guy', async () => {
      await say('go 371004');
      await say('wait 3730');
      await say('go 373002');
      await say('wait 3810');
      await say('go 381010');
      await say('wait 3810');
    }, 20000);

    it('enter engine room', async () => {
      await say('go 381006');
      await say('wait 3750');
      await say('go 375003');
      await say('wait 3770');
      await say('go 377001');
      await say('wait 4250');
      await say('go 425003');
      await say('wait 4230');
      await say('go 423004');
      await say('wait 4220');
      await say('go 422002');
      await say('wait 4210');
    }, 30000);

    it('save', async () => await saveTest(2));
  });

  describe('Enable engine', () => {
    it('load', async () => await loadTest(2));

    it('call cart', async () => {
      await say('go 421010');
      await say('go 421058');
      await say('wait 4212');
    }, 20000);

    it('enable atrium', async () => {
      await say('go 415050');
      await say('go 421040');
      await say('wait 414050');
      await say('go 414051');
      await say('wait 414052');
      await say('slide 1402 1');
      await say('go 414053');
      await say('wait 414050');
    }, 30000);

    it('enable injectors', async () => {
      await say('go 414070');
      await say('wait 413050');
      await say('go 413057');
      await say('go 413075');
      await say('go 413068');
      await say('wait 413050');
    }, 30000);

    it('enable ventricle', async () => {
      await say('go 413070');
      await say('wait 413080');
      await say('go 413074');
      await say('wait 412050');
      await say('go 412051');
      await say('wait 412052');
      await say('slide 1403 1');
      await say('go 412064');
      await say('wait 412050');
    }, 30000);

    it('return to bay', async () => {
      await say('go 412070');
      await say('wait 413080');
      await say('go 413073');
      await say('wait 413050');
      await say('go 413041');
      await say('wait 414050');
      await say('go 414071');
      await say('wait 415050');
      await say('go 421005');
      await say('wait 4210');
    }, 30000);

    it('turn on power', async () => {
      await say('go 421010');
      await say('slide 1452 9');
      await say('wait 421046');
      await say('wait 4210');
    }, 90000);

    it('save', async () => await saveTest(3));
  });

  describe.only('Go to juke box', () => {
    it('load', async () => await loadTest(3));

    it('play belle\'s music', async () => {
      await say('go 421012');
      await say('wait 4220');
      await say('go 422004');
      await say('wait 4240');
      await say('go 424004');
      await say('wait 4260');
      await say('go 426001');
      await say('wait 3760');
      await say('go 376003');
      await say('wait 3730');
      await say('go 373001');
      await say('wait 3710');
      await say('go 371005');
      await say('wait 2330');
      await say('go 233003');
      await say('wait 2370');
      await say('go 237001');
      await say('wait 2350');
      await say('go 235001');
      await say('wait 2270');
      await say('go 227004');
      await say('wait 2240');
      await say('go 224050');
    }, 45000);

    it('save', async () => await saveTest(4));
  });
});
