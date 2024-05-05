'use client';

import { Button } from "./ui/button";

const ChatButton = () => {
    return (
        <Button
            onClick={() => {
                window.location.href = `${window.location.origin}/rasa`;
            }}
            variant='destructive'
            style={{ marginBottom: '10px', textAlign: 'left' }}
            className="capitalize text-white hover:bg-orange-500"
        >
            Chat
        </Button>
    );
};

export default ChatButton;