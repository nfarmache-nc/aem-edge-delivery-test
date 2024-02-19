import { decorateMain, loadPage } from './scripts.js';
import { loadBlocks, getMetadata, toClassName } from './aem.js';

function decorateTemplateAndTheme(newDocument) {
  const addClasses = (element, classes) => {
    classes.split(',').forEach((c) => {
      element.classList.add(toClassName(c.trim()));
    });
  };
  document.body.className = 'appear';
  const template = getMetadata('template', newDocument);
  if (template) addClasses(document.body, template);
  const theme = getMetadata('theme', newDocument);
  if (theme) addClasses(document.body, theme);
}

async function fetchPage(path, shouldPushState = true) {
  const main = document.querySelector('body>main');
  // const plainPath = `${path}${path.endsWith('/') ? 'index' : ''}.plain.html`;
  let isOK = false;
  fetch(path)
    .then((response) => {
      isOK = response.ok;
      return response.text();
    })
    .then(async (html) => {
      if (shouldPushState) {
        window.history.pushState({}, '', path);
      }

      if (!isOK) {
        // eslint-disable-next-line no-use-before-define
        document.removeEventListener('click', clickHandler);
        document.open();
        document.write(html);
        document.close();
        await loadPage();
        return;
      }

      const newDocument = new DOMParser().parseFromString(html, 'text/html');
      document.title = newDocument.title;
      main.innerHTML = newDocument.querySelector('body>main').innerHTML;
      main.classList.add('hidden');
      decorateTemplateAndTheme(newDocument);
      decorateMain(main);
      await loadBlocks(main);
      main.classList.remove('hidden');
    });
}

const clickHandler = (event) => {
  const { target } = event;
  const url = new URL(target.href, document.location.href);
  if (target.tagName === 'A' && url.origin === document.location.origin) {
    event.preventDefault();
    const path = `${url.pathname}${url.search}${url.hash}`;
    fetchPage(path);
  }
}

function router() {
  document.addEventListener('click', clickHandler);

  window.addEventListener('popstate', (event) => {
    const url = new URL(document.location.href);
    const path = `${url.pathname}${url.search}${url.hash}`;
    fetchPage(path, false);
  });
}

router();
