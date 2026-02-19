/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AcceptInvitation from './pages/AcceptInvitation';
import AdminDevTools from './pages/AdminDevTools';
import AgileCoach from './pages/AgileCoach';
import Analysis from './pages/Analysis';
import AntiPatterns from './pages/AntiPatterns';
import ChooseAccess from './pages/ChooseAccess';
import Dashboard from './pages/Dashboard';
import DashboardAdmins from './pages/DashboardAdmins';
import DashboardCommonUsers from './pages/DashboardCommonUsers';
import DashboardContributors from './pages/DashboardContributors';
import Demo from './pages/Demo';
import Details from './pages/Details';
import Home from './pages/Home';
import JiraProjectSelector from './pages/JiraProjectSelector';
import Plans from './pages/Plans';
import Privacy from './pages/Privacy';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Results from './pages/Results';
import Settings from './pages/Settings';
import TeamManagement from './pages/TeamManagement';
import TrelloProjectSelector from './pages/TrelloProjectSelector';
import VerifyEmail from './pages/VerifyEmail';
import acceptInvitation from './pages/accept-invitation';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AcceptInvitation": AcceptInvitation,
    "AdminDevTools": AdminDevTools,
    "AgileCoach": AgileCoach,
    "Analysis": Analysis,
    "AntiPatterns": AntiPatterns,
    "ChooseAccess": ChooseAccess,
    "Dashboard": Dashboard,
    "DashboardAdmins": DashboardAdmins,
    "DashboardCommonUsers": DashboardCommonUsers,
    "DashboardContributors": DashboardContributors,
    "Demo": Demo,
    "Details": Details,
    "Home": Home,
    "JiraProjectSelector": JiraProjectSelector,
    "Plans": Plans,
    "Privacy": Privacy,
    "Register": Register,
    "ResetPassword": ResetPassword,
    "Results": Results,
    "Settings": Settings,
    "TeamManagement": TeamManagement,
    "TrelloProjectSelector": TrelloProjectSelector,
    "VerifyEmail": VerifyEmail,
    "accept-invitation": acceptInvitation,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};