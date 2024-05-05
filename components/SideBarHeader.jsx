import { TbMessageChatbot } from 'react-icons/tb';


const SideBarHeader = () => {
  return (
    <div className="flex items-center mb-4 gap-4 px-4">
      <TbMessageChatbot className="w-10 h-10 text-white" />

      <h2 className="text-xl font-extrabold text-white"> Virtual TA</h2>
    </div>
  );
};
export default SideBarHeader;
