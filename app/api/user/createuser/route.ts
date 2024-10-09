import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import prisma from "@/prisma/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  const user = await currentUser();
  console.log(user?.id);
  console.log(user?.primaryEmailAddress?.emailAddress);

  if (!user)
    return NextResponse.json({
      error: "User Not Signed In",
    });

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        user_id: user?.id,
      },
    });
    console.log(existingUser);
    let newUser = null;
    if (!existingUser) {
      newUser = await prisma.user.create({
        data: {
          user_id: user?.id,
          email: String(user?.primaryEmailAddress?.emailAddress),
          password: "",
        },
      });
      console.log(newUser);
    } else {
      newUser = existingUser;
    }
    return NextResponse.json({
      data: newUser,
      message: "User Created Successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error,
      },
      {
        status: 400,
      },
    );
  }
}
