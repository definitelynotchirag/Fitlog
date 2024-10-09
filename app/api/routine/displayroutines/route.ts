import { NextResponse, NextRequest } from "next/server";
import axios from "axios";
import React from "react";
import prisma from "@/prisma/prisma";

export async function GET(request: NextRequest) {
    const routines = await prisma.routine.findMany();
    console.log(routines);
    // const data = ["hi"]
    return NextResponse.json(
      {
        data: routines,
        message: "Routines Displayed",
      })
//   try {
    
//     const routines = await prisma.routine.findMany();
//     console.log(routines);
//     return NextResponse.json(
//       {
//         data: routines,
//         message: "Routines Displayed",
//       }
//     );
//   } catch (error: any) {
//     return NextResponse.json({ error: error}, { status: 404 });
//   }
}
