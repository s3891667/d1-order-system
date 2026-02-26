import {prisma} from "@/lib/prisma"

export async function getAllStaff() {
  return await prisma.staff.findMany({
    orderBy: {
      displayName: "asc",
    },
  })
}
