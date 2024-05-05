'use client';

import { Button } from "./ui/button";

const ProfileButton = () => {
    return (
        <>
            <Button
                onClick={() => {
                    window.location.href = `${window.location.origin}/profile`;
                }}
                variant='destructive'
                style={{ marginBottom: '10px', textAlign: 'left' }}
                className="capitalize text-white hover:bg-orange-500"
            >
                Profile
            </Button>
            <Button
                onClick={() => {
                    window.location.href = 'https://forms.gle/rijEgWfcTbqXyXXN8';
                
                }}
                variant='destructive'
                style={{ marginBottom: '10px', textAlign: 'left' }}
                className="capitalize text-white hover:bg-orange-500"
            >
                Review Survey
            </Button>
        </>
    );
};

export default ProfileButton;