import Home from './pages/Home';
import Privacy from './pages/Privacy';
import __Layout from './Layout.jsx';

export const PAGES = {
    "Home": Home,
    "Privacy": Privacy,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};