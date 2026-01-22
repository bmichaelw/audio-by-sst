import Admin from './pages/Admin';
import ArtistProfile from './pages/ArtistProfile';
import Community from './pages/Community';
import Discover from './pages/Discover';
import Home from './pages/Home';
import Library from './pages/Library';
import LiveSessionViewer from './pages/LiveSessionViewer';
import LiveSessions from './pages/LiveSessions';
import NotFound from './pages/NotFound';
import Playlists from './pages/Playlists';
import Pricing from './pages/Pricing';
import Profile from './pages/Profile';
import ResonancePath from './pages/ResonancePath';
import Settings from './pages/Settings';
import ArtistAnalytics from './pages/ArtistAnalytics';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "ArtistProfile": ArtistProfile,
    "Community": Community,
    "Discover": Discover,
    "Home": Home,
    "Library": Library,
    "LiveSessionViewer": LiveSessionViewer,
    "LiveSessions": LiveSessions,
    "NotFound": NotFound,
    "Playlists": Playlists,
    "Pricing": Pricing,
    "Profile": Profile,
    "ResonancePath": ResonancePath,
    "Settings": Settings,
    "ArtistAnalytics": ArtistAnalytics,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};