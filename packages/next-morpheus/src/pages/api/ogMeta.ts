import puppeteer from 'puppeteer';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { scene } = req.query;
  const renderUrl = `${process.env.OGMETA_URL}/render/${scene}/`;

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(renderUrl, {});
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const JPEG = await page.screenshot({
      fullPage: true,
    });
    await browser.close();
    res.setHeader('content-type', 'image/jpeg');
    res.status(200).send(JPEG);
  } catch (e) {
    console.error(e);
    res.status(500).send('not okay');
  }
};
