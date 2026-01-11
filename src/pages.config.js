import Admin from './pages/Admin';
import Home from './pages/Home';
import Library from './pages/Library';
import NotFound from './pages/NotFound';
import Pricing from './pages/Pricing';
import Profile from './pages/Profile';
import ResonancePath from './pages/ResonancePath';
import Settings from './pages/Settings';
import Community from './pages/Community';
import Playlists from './pages/Playlists';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "Home": Home,
    "Library": Library,
    "NotFound": NotFound,
    "Pricing": Pricing,
    "Profile": Profile,
    "ResonancePath": ResonancePath,
    "Settings": Settings,
    "Community": Community,
    "Playlists": Playlists,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};