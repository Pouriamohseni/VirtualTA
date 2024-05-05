import Link from 'next/link';

const HomePage = () => {
  return (
    <div className="hero min-h-screen bg-orange-500">
      <div className="hero-content">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-6xl font-bold text-green-100">
              UTD Virtual TA
            </h1>
            <p className="py-6 text-large leading-loose text-white">
              This is a UTD virtual assistant chatbot made using ML
            </p>
            <Link href="/login/sign-in" className="btn  bg-green-500 text-white ">
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;
