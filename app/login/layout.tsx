import { FC, ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout: FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div
      className='bg-slate-200 p-10 rounded-md h-screen overflow-hidden'
      style={{
        backgroundImage: "url('/utd.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {children}
    </div>
  );
};

export default AuthLayout;

