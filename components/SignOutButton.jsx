'use client';

import { signOut } from "next-auth/react";
import { Button } from "./ui/button";

const SignOutButton = () => {
    return (
        <Button onClick={() => signOut({
            redirect: true,
            callbackUrl: `${window.location.origin}/`,
        })
        } 
        variant='destructive'
        style={{ marginBottom: '10px', textAlign: 'left' }}
        className="capitalize text-white hover:bg-red-500"
        >
            Sign Out 
        </Button>
    );
};

export default SignOutButton;