import ChangePassButton from './ChangePassButton';
import { authOptions } from '/lib/auth';
import { getServerSession } from 'next-auth';

const UserProfile = async () => {  
    const session = await getServerSession(authOptions);

    const containerStyle = {
        width: '60%', 
        margin: 'auto',
        marginTop: '20vh', 
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#fff',
        color: '#000', 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    };

    const headingStyle = {
        fontSize: '24px',
        marginBottom: '20px',
        fontWeight: 'bold',
    };

    const userInfoStyle = {
        marginBottom: '20px', 
        textAlign: 'left', 
    };

    return (
        <div style={containerStyle}>
            <h1 style={headingStyle}>User Info</h1>
            <div style={userInfoStyle}>
                <p><strong>Email:</strong> {session?.user.email}</p>
                <p><strong>Username:</strong> {session?.user.username}</p>
            </div>
            <ChangePassButton />
        </div>
    );
};

export default UserProfile;
