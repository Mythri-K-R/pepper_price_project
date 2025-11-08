import ChatAssistant from "@/components/ChatAssistant";
import Navigation from "@/components/Navigation";

const ChatPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 flex flex-col py-6 px-4">
        <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full">
          <ChatAssistant />
        </div>
      </main>
    </div>
  );
};

export default ChatPage;