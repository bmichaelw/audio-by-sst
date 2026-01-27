import Admin from './pages/Admin';
import ArtistAnalytics from './pages/ArtistAnalytics';
import ArtistProfile from './pages/ArtistProfile';
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
import EmbedSingleTrack from './pages/EmbedSingleTrack';
import EmbedFlowPlayer from './pages/EmbedFlowPlayer';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "ArtistAnalytics": ArtistAnalytics,
    "ArtistProfile": ArtistProfile,
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
    "EmbedSingleTrack": EmbedSingleTrack,
    "EmbedFlowPlayer": EmbedFlowPlayer,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};