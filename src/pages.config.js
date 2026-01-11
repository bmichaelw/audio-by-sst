import Home from './pages/Home';
import Library from './pages/Library';
import Admin from './pages/Admin';
import Pricing from './pages/Pricing';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Library": Library,
    "Admin": Admin,
    "Pricing": Pricing,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};