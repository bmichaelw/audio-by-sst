import Admin from './pages/Admin';
import Home from './pages/Home';
import Library from './pages/Library';
import NotFound from './pages/NotFound';
import Pricing from './pages/Pricing';
import Profile from './pages/Profile';
import ResonancePath from './pages/ResonancePath';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "Home": Home,
    "Library": Library,
    "NotFound": NotFound,
    "Pricing": Pricing,
    "Profile": Profile,
    "ResonancePath": ResonancePath,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};