'use client';

import { Button } from "./ui/button";

const ChangePassButton = () => {
    return (
        <Button
            onClick={() => {
                window.location.href = `${window.location.origin}/profile/changePass`;
            }}
            variant='destructive'
            style={{ marginBottom: '10px', textAlign: 'left' }}
            className="capitalize text-white bg-orange-500 hover:bg-red-500"
        >
            Change Password
        </Button>
    );
};

export default ChangePassButton;
