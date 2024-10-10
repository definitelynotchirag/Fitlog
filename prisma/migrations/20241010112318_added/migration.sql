-- CreateTable
CREATE TABLE "UserChatHistory" (
    "userId" TEXT NOT NULL,
    "messages" TEXT[],

    CONSTRAINT "UserChatHistory_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "UserChatHistory" ADD CONSTRAINT "UserChatHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
