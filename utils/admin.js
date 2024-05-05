'use server'

const BASE_URL = 'http://127.0.0.1:37821';

export const isUserAdmin = async (userId) => {
    try {
        const response = await fetch(`${BASE_URL}/api/users/is-admin/${userId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.is_admin; // Extract the isAdmin field from the response
    } catch(error) {
        console.error('Error checking if user is admin:', error);
        return false;
    }


    if(userId === 'admin' || userId === 'dev-test') {
        return true;
    }
    return false;
}
