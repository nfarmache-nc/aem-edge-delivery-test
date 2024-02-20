import { decorateMain } from './scripts.js';
import { loadBlocks, getMetadata, toClassName } from './aem.js';

const excludedPaths = [
  '/excluded',
];

const indexPath = '/head-index.json';

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

async function render(html) {
  const main = document.querySelector('body>main');
  const newDocument = new DOMParser().parseFromString(html, 'text/html');
  document.title = newDocument.title;
  main.innerHTML = newDocument.querySelector('body>main').innerHTML;
  main.classList.add('hidden');
  decorateTemplateAndTheme(newDocument);
  decorateMain(main);
  await loadBlocks(main);
  main.classList.remove('hidden');
}

async function navigate(path, shouldPushState = true) {
  fetch(path)
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (!response.ok || !contentType || !contentType.includes('text/html')) {
        window.location.href = path;
      }

      return response.text();
    })
    .then(async (html) => {
      if (shouldPushState) {
        window.history.pushState({}, '', path);
      }

      render(html);
    });
}

function checkUrl(href) {
  const url = new URL(href, document.location.href);
  const path = `${url.pathname}${url.search}${url.hash}`;
  const simplePath = url.pathname;

  // check origin
  if (url.origin !== document.location.origin) {
    return { shouldFetchPage: false };
  }

  // check excluded paths
  if (excludedPaths.some((excludedPath) => (
    document.location.pathname === excludedPath
    || document.location.pathname.startsWith(`${excludedPath}/`)
    || simplePath === excludedPath
    || simplePath.startsWith(`${excludedPath}/`)
  ))) {
    return { shouldFetchPage: false };
  }

  // ok
  return { path, shouldFetchPage: true };
}

const clickHandler = (event) => {
  const { target } = event;
  if (target.tagName !== 'A' || typeof target.href === 'undefined') return;
  const { shouldFetchPage, path } = checkUrl(target.href);
  if (!shouldFetchPage) return;

  event.preventDefault();
  navigate(path);
};

const popstateHandler = () => {
  const { path } = checkUrl(document.location.href);
  navigate(path, false);
}

function loadIndex() {
  fetch(indexPath)
    .then((response) => response.json())
    .then((indexData) => {
      console.log(indexData);
    });
}

function router() {
  document.addEventListener('click', clickHandler);
  window.addEventListener('popstate', popstateHandler);
  setTimeout(loadIndex, 2000);
}

router();
