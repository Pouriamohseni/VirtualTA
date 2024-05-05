import NavLinks from './NavLinks';
import SideBarHeader from './SideBarHeader';
import ProfileButton from './ProfileButton';
import SignOutButton from './SignOutButton';


const sidebar = () => {
  return (
    <div className="px-4 w-80 min-h-full  py-12 grid grid-rows-[auto,1fr,auto] bg-slate-900">
      <SideBarHeader />
      <NavLinks />
      <ProfileButton />
      <SignOutButton />
    </div>
  );
};
export default sidebar;
