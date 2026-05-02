import { routes } from "./routes";

const currentRoute = (path) => {
  path = path.slice(1);
  let match;
  for (const route of routes) {
    if (route.path === path) {
      match = route
    }
  }
  return match;
}

const render = () => {
  const path = window.location.hash || "/#";
  let ruta = currentRoute(path)
  const container = document.querySelector('#app');
  let html = ruta.view();
  ruta.init()
  container.innerHTML = html;
}

export const initRouter = () => {
  render()
}