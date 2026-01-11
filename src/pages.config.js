import Home from './pages/Home';
import Library from './pages/Library';
import Admin from './pages/Admin';
import ResonancePath from './pages/ResonancePath';
import Pricing from './pages/Pricing';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Library": Library,
    "Admin": Admin,
    "ResonancePath": ResonancePath,
    "Pricing": Pricing,
    "NotFound": NotFound,
    "Profile": Profile,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};