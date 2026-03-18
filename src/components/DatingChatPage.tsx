import ChatBox from './ChatBox';

export default function DatingChatPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-3">
        <p className="text-sm text-muted-foreground">❤️ غرفة التعارف</p>
      </div>
      <ChatBox chatId="datingChat" showMedia={false} />
    </div>
  );
}
