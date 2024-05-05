import { getServerSession } from 'next-auth';
import Sidebar from '/components/sidebar';
import { FaBarsStaggered } from 'react-icons/fa6';
import { authOptions } from "/lib/auth";

const Layout = async ({ children }) => {
  const session = await getServerSession(authOptions);
  if(session?.user) {
    return (
      <div className="drawer lg:drawer-open">
        <input type="checkbox" id="my-drawer-2" className="drawer-toggle" />

        <div className="drawer-content">
         <label
            htmlFor="my-drawer-2"
            className="drawer-button lg:hidden fixed top-6 right-6"
          >
            <FaBarsStaggered className="w-8 h-8 text-primary" />
          </label>
          <div className="bg-orange-400 px-8 py-12 min-h-screen">{children}</div>
        </div>
        <div className="drawer-side">
          <label
            htmlFor="my-drawer-2"
            aria-label="close sidebar"
            className="drawer-overlay"
          ></label>
          <Sidebar />
        </div>
      </div>
    );
  }
  return (<meta http-equiv='refresh' content="0; /login/sign-in"></meta>);
};
export default Layout;
