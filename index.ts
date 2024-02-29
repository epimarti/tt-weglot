// https://bun.sh/

import { gzipSync } from "bun";

const host = "www.dow.com";
const dictionnaryFile = Bun.file('./dictionary.json');

const translateBody = async (body: string) => {
  const dictionary = await dictionnaryFile.json() as { [key: string]: string };

  const res = Object.entries(dictionary)
    .reduce((inTranslation: string, [original, translation]: [string, string]) => {
      const reg = new RegExp(`${original}(?=[^><]*<)`, 'g')
      return inTranslation.replaceAll(reg, translation)
    }, body);
  return res;
}

Bun.serve({
  port: 36107,
  fetch: async (request) => {
    const reqUrl = new URL(request.url);
    let toTranslate = false
    let path = reqUrl.pathname
    if (path.startsWith('/en-us')) {
      return Response.redirect(`/fr-fr${path.slice(6)}`);
    }

    if (path.startsWith('/fr-fr')) {
      path = `/en-us${path.slice(6)}`;
      toTranslate = true;
    }

    const hostRes = await fetch(`https://${host}${path}`, {
      mode: 'cors',
      redirect: 'manual'
    });

    if (hostRes.status === 302) {
      return Response.redirect(hostRes.headers.get('location') || '');
    }

    hostRes.headers.delete('Content-Encoding')
    if (toTranslate) {
      const translatedBody: any = await translateBody(await hostRes.text());
      return new Response(translatedBody, {
        headers: hostRes.headers
      });
    }
    return new Response(hostRes.body, {
      headers: hostRes.headers
    })
  },
});

console.log("Run on http://localhost:36107");