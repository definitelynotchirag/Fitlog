// import { NextResponse, NextRequest } from "next/server";
// import axios from "axios";
// import React from "react";
// import prisma from "@/prisma/prisma";

// export async function GET(request: NextRequest) {
//     const routines = await prisma.routine.findMany();
//     console.log(routines);
//     // const data = ["hi"]
//     return NextResponse.json(
//       {
//         data: routines,
//         message: "Routines Displayed",
//       })
// //   try {

// //     const routines = await prisma.routine.findMany();
// //     console.log(routines);
// //     return NextResponse.json(
// //       {
// //         data: routines,
// //         message: "Routines Displayed",
// //       }
// //     );
// //   } catch (error: any) {
// //     return NextResponse.json({ error: error}, { status: 404 });
// //   }
// }
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { currentUser } from "@clerk/nextjs/server"; // Clerk's currentUser method

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser(); // Get the authenticated user

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const routines = await prisma.routine.findMany({
      where: {
        user_id: user.id, // Using Clerk's user ID
      },
    });

    return NextResponse.json({ routines });
  } catch (error) {
    console.error("Error fetching routines:", error);
    return NextResponse.json(
      { error: "Error fetching routines" },
      { status: 500 },
    );
  }
}
