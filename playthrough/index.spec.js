import path from 'path';
import fs from 'fs';
import ioClient from 'socket.io-client';
import puppeteer from 'puppeteer';
import config from 'config';
import uuid from 'uuid';
import Promise from 'bluebird';

Promise.promisifyAll(fs);

describe('playthrough', () => {
  let client;
  let channel;
  let browser;
  let page;
  let lastTest;

  beforeAll(() => puppeteer.launch({
    headless: false,
  })
    .then((b) => {
      browser = b;
      return b.newPage();
    })
    .then((p) => {
      page = p;
      page.on('pageerror', (error) => {
        console.log('ERROR:', error);
      });
      // return page.goto(config.test.launch, {
      //   waitUntil: 'networkidle0',
      // }).then(() => Promise.delay(500));
    })
    .then(() => {
      channel = uuid();
      client = ioClient(config.test.botEndpoint);
      return new Promise((resolve) => {
        client.on('connect', () => {
          client.emit('test', config.test.botToken, channel, () => {
            resolve();
          });
        });
      });
    }));
  afterAll(() => {
    client.disconnect();
    browser.close();
  });
  afterEach(() => {
    client.removeAllListeners(channel);
  });

  function say(command) {
    return new Promise((resolve) => {
      client.emit(channel, command, resolve);
    });
  }
  beforeAll(() => page.click('body'));

  it.skip('save/load', async () => {
    const save = await say('save');
    await say(`load\n${JSON.stringify(save)}`);
  });

  describe.skip('Breaching airlock', () => {
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

    it('save', async () => {
      const save = await say('save');
      await fs.writeFileAsync(path.join(__dirname, 'save1.json'), JSON.stringify(save, null, 2), 'utf8');
      expect(save).toMatchSnapshot();
      lastTest = 'Breaching airlock';
    });
  });

  describe('Turn on lights', () => {
    it('load', async () => {
      if (lastTest !== 'Breaching airlock') {
        const data = await fs.readFileAsync(path.join(__dirname, 'save1.json'), 'utf8');
        await say(`load\n${JSON.stringify(JSON.parse(data))}`);
      }
    });

    it('release balloon', async () => {
      await say('go 200104');
      await say('wait 2040');
    });
  });
});
